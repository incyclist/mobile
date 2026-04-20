package com.incyclist.folderaccess

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
                // Treat any error as non-existent rather than crashing
                promise.resolve(false)
            }
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * List children of a SAF tree URI using DocumentsContract.
     *
     * Builds a child documents URI from the tree, then queries the
     * ContentResolver for DOCUMENT_ID, DISPLAY_NAME, and MIME_TYPE.
     * Returns a WritableArray of { name, uri, isDirectory } maps.
     *
     * The returned uri for each child is a document URI (not a tree URI),
     * suitable for passing to readFile() and exists().
     */
    private fun listSafChildren(treeUri: Uri): WritableArray {
        val results = Arguments.createArray()
        val contentResolver = reactApplicationContext.contentResolver

        // Get the document ID for the tree root
        val treeDocumentId = try {
            DocumentsContract.getTreeDocumentId(treeUri)
        } catch (e: Exception) {
            // Not a tree URI — try treating it as a document URI directly
            DocumentsContract.getDocumentId(treeUri)
        }

        // Build the children URI
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

                // Build a document URI for this child — usable with readFile/exists
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

    /**
     * List children of a local file:// path.
     */
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

    /**
     * Check existence of a content:// document via ContentResolver query.
     * Returns false if the query returns no rows or throws.
     */
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
