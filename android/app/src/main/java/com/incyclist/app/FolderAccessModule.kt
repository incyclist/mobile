package com.incyclist.app

import android.content.ContentResolver
import android.net.Uri
import android.provider.DocumentsContract
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

@ReactModule(name = FolderAccessModule.NAME)
class FolderAccessModule(reactContext: ReactApplicationContext) :
    NativeFolderAccessSpec(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun getName(): String = NAME

    /**
     * List immediate children of a directory URI.
     *
     * For content:// SAF tree URIs: uses DocumentsContract to enumerate
     * children via ContentResolver. Returns the document URI of each child
     * (not the tree URI) so that readFile/exists can be called on them.
     *
     * For file:// URIs: falls back to standard File.listFiles().
     */
    override fun listFiles(uri: String, promise: Promise) {
        scope.launch {
            try {
                val parsed = Uri.parse(uri)
                when (parsed.scheme) {
                    ContentResolver.SCHEME_CONTENT -> {
                        promise.resolve(listSafChildren(parsed))
                    }
                    ContentResolver.SCHEME_FILE, null -> {
                        promise.resolve(listLocalChildren(parsed))
                    }
                    else -> promise.reject("ERR_UNSUPPORTED", "Unsupported URI scheme: ${parsed.scheme}")
                }
            } catch (e: Exception) {
                promise.reject("ERR_LIST", "Failed to list '$uri': ${e.message}", e)
            }
        }
    }

    /**
     * Read file contents via ContentResolver (content://) or File (file://).
     * encoding: "utf8" | "base64"
     */
    override fun readFile(uri: String, encoding: String, promise: Promise) {
        scope.launch {
            try {

                val parsed = Uri.parse(uri)

                android.util.Log.d("FolderAccessModule", "Readfile (${parsed},${encoding})")

                val bytes: ByteArray = when (parsed.scheme) {
                    ContentResolver.SCHEME_CONTENT -> {
                        reactApplicationContext.contentResolver
                            .openInputStream(parsed)
                            ?.use { it.readBytes() }
                            ?: throw Exception("ContentResolver returned null stream for '$uri'")
                    }
                    ContentResolver.SCHEME_FILE, null -> {
                        File(parsed.path ?: uri).readBytes()
                    }
                    else -> throw Exception("Unsupported URI scheme: ${parsed.scheme}")
                }

                val result = when (encoding) {
                    "base64" -> Base64.encodeToString(bytes, Base64.NO_WRAP)
                    else -> String(bytes, Charsets.UTF_8)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                android.util.Log.d("FolderAccessModule", "Readfile Error: ${e.message}")

                promise.reject("ERR_READ", "Failed to read '$uri': ${e.message}", e)
            }
        }
    }

    /**
     * Check whether a document/file exists.
     * For content:// URIs: queries ContentResolver for the document ID.
     * For file:// URIs: uses File.exists().
     */
    override fun exists(uri: String, promise: Promise) {
        scope.launch {
            try {
                val parsed = Uri.parse(uri)
                val result = when (parsed.scheme) {
                    ContentResolver.SCHEME_CONTENT -> {
                        existsViaContentResolver(parsed)
                    }
                    ContentResolver.SCHEME_FILE, null -> {
                        File(parsed.path ?: uri).exists()
                    }
                    else -> false
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private fun listSafChildren(treeUri: Uri): WritableArray {
        val results = Arguments.createArray()
        val contentResolver = reactApplicationContext.contentResolver

        val treeDocumentId = try {
            DocumentsContract.getDocumentId(treeUri)
        } catch (e: Exception) {
            DocumentsContract.getTreeDocumentId(treeUri)
        }

        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(
            treeUri,
            treeDocumentId
        )

        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
        )

        contentResolver.query(childrenUri, projection, null, null, null)?.use { cursor ->
            while (cursor.moveToNext()) {
                val documentId = cursor.getString(0)
                val displayName = cursor.getString(1)
                val mimeType = cursor.getString(2)
                val isDirectory = mimeType == DocumentsContract.Document.MIME_TYPE_DIR

                val documentUri = DocumentsContract.buildDocumentUriUsingTree(
                    treeUri,
                    documentId
                )

                val map: WritableMap = Arguments.createMap()
                map.putString("name", displayName)
                map.putString("uri", documentUri.toString())
                map.putBoolean("isDirectory", isDirectory)
                results.pushMap(map)
            }
        }

        return results
    }

    private fun listLocalChildren(uri: Uri): WritableArray {
        val results = Arguments.createArray()
        val path = uri.path ?: return results
        val dir = File(path)

        dir.listFiles()?.forEach { file ->
            val map: WritableMap = Arguments.createMap()
            map.putString("name", file.name)
            map.putString("uri", Uri.fromFile(file).toString())
            map.putBoolean("isDirectory", file.isDirectory)
            results.pushMap(map)
        }

        return results
    }

    private fun existsViaContentResolver(uri: Uri): Boolean {
        return try {
            val projection = arrayOf(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
            reactApplicationContext.contentResolver
                .query(uri, projection, null, null, null)
                ?.use { cursor -> cursor.count > 0 }
                ?: false
        } catch (e: Exception) {
            false
        }
    }

    companion object {
        const val NAME = "FolderAccess"
    }
}
