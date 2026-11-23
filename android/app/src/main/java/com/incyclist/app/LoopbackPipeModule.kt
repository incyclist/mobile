package com.incyclist.app

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * LoopbackPipeModule - native implementation of the loopback byte pipe (Android only).
 *
 * Same contract as the JS pipe (react-native-tcp-socket): a TCP listener bound to 127.0.0.1 only,
 * on a random port, forwards every accepted connection to ONE fixed upstream given to start() and
 * copies the bytes unchanged in both directions. It does not parse HTTP, so it never sees a media
 * token, a path or a header. The bytes never cross the JS bridge, which is the point: the JS pipe
 * was limited to a few dozen KB/s.
 *
 * Nothing here throws into the bridge or the process: every thread body catches Throwable.
 * Nothing logs addresses or payload; per connection only byte counts and the duration are
 * reported, as the "LoopbackPipeDone" device event.
 */
@ReactModule(name = LoopbackPipeModule.NAME)
class LoopbackPipeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val pipes = ConcurrentHashMap<Int, Pipe>()

    // daemon threads: they must never keep the process alive
    private val executor = Executors.newCachedThreadPool { r ->
        Thread(r, "loopback-pipe").apply { isDaemon = true }
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun start(upstreamHost: String, upstreamPort: Double, promise: Promise) {
        try {
            val port = upstreamPort.toInt()
            if (upstreamHost.isEmpty() || port <= 0 || port > 65535) {
                promise.resolve(0)
                return
            }
            // the loopback address only, never the wildcard address
            val server = ServerSocket(0, BACKLOG, InetAddress.getByName(LOOPBACK_HOST))
            val localPort = server.localPort
            val pipe = Pipe(server, upstreamHost, port)
            pipes[localPort] = pipe
            try {
                executor.execute { acceptLoop(pipe) }
            } catch (t: Throwable) {
                pipes.remove(localPort)
                closeQuietly(server)
                throw t
            }
            promise.resolve(localPort)
        } catch (t: Throwable) {
            Log.e(NAME, "start failed: ${t.javaClass.simpleName}")
            try {
                promise.resolve(0)
            } catch (_: Throwable) {
                // nothing left to report to
            }
        }
    }

    /** port < 0: stop every pipe */
    @ReactMethod
    fun stop(port: Double, promise: Promise) {
        try {
            val p = port.toInt()
            val targets = if (p < 0) pipes.keys.toList() else listOf(p)
            targets.forEach { key -> pipes.remove(key)?.let { shutdown(it) } }
        } catch (t: Throwable) {
            Log.e(NAME, "stop failed: ${t.javaClass.simpleName}")
        }
        try {
            promise.resolve(null)
        } catch (_: Throwable) {
            // nothing left to report to
        }
    }

    override fun invalidate() {
        try {
            pipes.keys.toList().forEach { key -> pipes.remove(key)?.let { shutdown(it) } }
            executor.shutdownNow()
        } catch (_: Throwable) {
            // best effort
        }
        super.invalidate()
    }

    private class Pipe(val server: ServerSocket, val host: String, val port: Int) {
        val connections: MutableSet<Connection> = ConcurrentHashMap.newKeySet()
        val stopped = AtomicBoolean(false)
    }

    private inner class Connection(val pipe: Pipe, val client: Socket) {
        var upstream: Socket? = null
        val closed = AtomicBoolean(false)
        val bytesUp = AtomicLong(0)   // client -> computer
        val bytesDown = AtomicLong(0) // computer -> client
        val openPumps = AtomicInteger(0)
        val startedAt = System.currentTimeMillis()

        fun close() {
            if (!closed.compareAndSet(false, true)) return
            pipe.connections.remove(this)
            closeQuietly(client)
            upstream?.let { closeQuietly(it) }
            emitDone(this)
        }
    }

    private fun shutdown(pipe: Pipe) {
        if (!pipe.stopped.compareAndSet(false, true)) return
        closeQuietly(pipe.server)
        pipe.connections.toList().forEach { c ->
            try {
                c.close()
            } catch (_: Throwable) {
                // best effort
            }
        }
    }

    private fun acceptLoop(pipe: Pipe) {
        try {
            while (!pipe.stopped.get() && !pipe.server.isClosed) {
                val client = try {
                    pipe.server.accept()
                } catch (e: IOException) {
                    break // closed by stop(), or the listener broke
                }
                try {
                    handleAccepted(pipe, client)
                } catch (t: Throwable) {
                    Log.e(NAME, "accept failed: ${t.javaClass.simpleName}")
                    closeQuietly(client)
                }
            }
        } catch (t: Throwable) {
            Log.e(NAME, "acceptLoop failed: ${t.javaClass.simpleName}")
        } finally {
            pipes.remove(pipe.server.localPort, pipe)
            shutdown(pipe)
        }
    }

    private fun handleAccepted(pipe: Pipe, client: Socket) {
        // peer filter: the listener is loopback-bound, so this is a second line of defence
        if (client.inetAddress?.isLoopbackAddress != true) {
            closeQuietly(client)
            return
        }
        if (pipe.connections.size >= MAX_CONNECTIONS) {
            Log.w(NAME, "connection refused: limit of $MAX_CONNECTIONS reached")
            closeQuietly(client)
            return
        }
        val conn = Connection(pipe, client)
        pipe.connections.add(conn)
        try {
            executor.execute { runConnection(conn) }
        } catch (t: Throwable) {
            conn.close()
        }
    }

    private fun runConnection(conn: Connection) {
        try {
            val up = Socket()
            conn.upstream = up
            if (conn.closed.get()) { // closed while connecting
                closeQuietly(up)
                return
            }
            up.tcpNoDelay = true
            up.keepAlive = true
            up.receiveBufferSize = SOCKET_BUFFER
            up.connect(InetSocketAddress(conn.pipe.host, conn.pipe.port), CONNECT_TIMEOUT_MS)
            if (conn.closed.get()) {
                closeQuietly(up)
                return
            }
            conn.client.tcpNoDelay = true
            conn.client.sendBufferSize = SOCKET_BUFFER

            conn.openPumps.set(2)
            try {
                executor.execute { pump(conn, conn.client, up, conn.bytesUp) }
            } catch (t: Throwable) {
                conn.close()
                return
            }
            pump(conn, up, conn.client, conn.bytesDown)
        } catch (t: Throwable) {
            // connect failure or timeout: the player sees a closed connection
            Log.w(NAME, "upstream connect failed: ${t.javaClass.simpleName}")
            conn.close()
        }
    }

    /** blocking copy with a bounded buffer: the OS socket buffers give the back-pressure */
    private fun pump(conn: Connection, from: Socket, to: Socket, counter: AtomicLong) {
        try {
            val input = from.getInputStream()
            val output = to.getOutputStream()
            val buffer = ByteArray(BUFFER_SIZE)
            while (true) {
                val n = input.read(buffer)
                if (n < 0) break
                output.write(buffer, 0, n)
                counter.addAndGet(n.toLong())
            }
            // clean end of one direction: pass the half-close on, the other direction may still flush
            try {
                to.shutdownOutput()
            } catch (_: Throwable) {
                // already closed
            }
            if (conn.openPumps.decrementAndGet() <= 0) conn.close()
        } catch (t: Throwable) {
            // a reset or an abort (client gone, revoke): tear down both sides
            conn.close()
        }
    }

    private fun emitDone(conn: Connection) {
        try {
            if (!reactApplicationContext.hasActiveReactInstance()) return
            val map = Arguments.createMap()
            map.putDouble("bytesUp", conn.bytesUp.get().toDouble())
            map.putDouble("bytesDown", conn.bytesDown.get().toDouble())
            map.putDouble("durationMs", (System.currentTimeMillis() - conn.startedAt).toDouble())
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_DONE, map)
        } catch (_: Throwable) {
            // reporting must never break a connection
        }
    }

    private fun closeQuietly(c: java.io.Closeable) {
        try {
            c.close()
        } catch (_: Throwable) {
            // nothing to do
        }
    }

    companion object {
        const val NAME = "LoopbackPipe"
        const val EVENT_DONE = "LoopbackPipeDone"
        private const val LOOPBACK_HOST = "127.0.0.1"
        private const val MAX_CONNECTIONS = 32
        private const val BACKLOG = 50
        private const val CONNECT_TIMEOUT_MS = 10000
        private const val BUFFER_SIZE = 64 * 1024
        private const val SOCKET_BUFFER = 256 * 1024
    }
}
