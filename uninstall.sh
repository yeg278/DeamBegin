# 这个脚本会在删除模块的时候执行
MODDULE_PATH="/data/user/0/com.omarea.vtools/files/"
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
rm -f $MODDULE_PATH/_FASDualCore.json 
if [ -n "$(getprop persist.sys.oiface.enable)" ]; then
	setprop persist.sys.oiface.enable 1
	start oiface
fi