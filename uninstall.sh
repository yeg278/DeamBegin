# 这个脚本会在删除模块的时候执行
MODDULE_PATH="/data/user/0/com.omarea.vtools/files/"
USER_PATH=/sdcard/Android/yc/uperf

wait_until_login() {
    # in case of /data encryption is disabled
    while [ "$(getprop sys.boot_completed)" != "1" ]; do
        sleep 1
    done

    # we doesn't have the permission to rw "/sdcard" before the user unlocks the screen
    local test_file="/sdcard/Android/.PERMISSION_TEST"
    true >"$test_file"
    while [ ! -f "$test_file" ]; do
        true >"$test_file"
        sleep 1
    done
    rm "$test_file"
}

on_remove() {
    wait_until_login

    # keep user perapp config
    cp -af $USER_PATH/perapp_powermode.txt /sdcard/
    rm -rf $USER_PATH
    mkdir -p $USER_PATH
    mv /sdcard/perapp_powermode.txt $USER_PATH/

    rm -f /data/powercfg*
}

# do not block boot
(on_remove &)

rm -f $MODDULE_PATH/_Apps.json
rm -f $MODDULE_PATH/_GAMES.json
rm -f $MODDULE_PATH/_GenshinImpact.json
rm -f $MODDULE_PATH/_HKRPG.json 
rm -f $MODDULE_PATH/_Launcher.json 
rm -f $MODDULE_PATH/_LOLM.json 
rm -f $MODDULE_PATH/_MiniProgram.json 
rm -f $MODDULE_PATH/_PUBG.json 
rm -f $MODDULE_PATH/_Scanner.json 
rm -f $MODDULE_PATH/_SGAME.json 
rm -f $MODDULE_PATH/_SpeedMobile.json 
rm -f $MODDULE_PATH/_Standby.json 
rm -f $MODDULE_PATH/categories.json 
rm -f $MODDULE_PATH/manifest.json 
rm -f $MODDULE_PATH/profile.json 
rm -f $MODDULE_PATH/threads.json 
rm -f $MODDULE_PATH/_DualCore.json 
rm -f $MODDULE_PATH/_ELP.json 
rm -f $MODDULE_PATH/_FAS.json 
rm -f $MODDULE_PATH/_FASDualCore.json rm /data/media/0/Android/ASGuard.txt
rm /data/media/0/Android/ASGuard.txt.bak
rm /data/media/0/Android/EAS.txt
rm /data/media/0/Android/log_ASG.txt
exit 0
if [ -n "$(getprop persist.sys.oiface.enable)" ]; then
	setprop persist.sys.oiface.enable 1
	start oiface
fi
