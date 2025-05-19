FILE_PATH="/data/data/com.ss.android.ugc.aweme/shared_prefs/aweme-app.xml"
DIR_PATH="/data/data/com.ss.android.ugc.aweme/shared_prefs"


if [ -f "$FILE_PATH" ]; then

sed -i 's/<int name="enable_ijk_hardware" value="0" \/>/<int name="enable_ijk_hardware" value="1" \/>/' "$FILE_PATH"
echo "okey"


chmod 444 "$FILE_PATH"
chmod 555 "$DIR_PATH"
echo "ok。"
else
echo "文件未找到：$FILE_PATH"
fi