echo "deleting metro cache ..."
rm -rf /tmp/metro-cache*
rm -rf /tmp/haste-map-*

echo "running gradlew clean ..."
cd android
./gradlew clean
cd ..
