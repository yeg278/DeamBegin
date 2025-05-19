#!/system/bin/sh
MODDULE_PATH="/data/user/0/com.omarea.vtools/files/"
rm -rf /data/adb/modules/sceneNP
rm -rf /data/adb/modules/DeamsBegin
rm -rf /data/adb/naki
rm -rf /data/adb/naki/asopt.conf
rm -rf /data/adb/modules/asoul_affinity_opt
rm -rf /data/adb/modules/murongruyan
rm -rf /data/adb/modules/ColorOS_Fuke
rm -rf /data/adb/modules/AppOpt
rm -rf /data/adb/modules/thread_opt

##########################################################################################
# Installation Message
##########################################################################################

# Set what you want to show when installing your mod

print_modname() {
  ui_print "*******************************"
  ui_print "  Magisk Module:         "
  ui_print "  By 小白杨"
  ui_print "*******************************"
}

##########################################################################################
# Replace list
##########################################################################################

# List all directories you want to directly replace in the system
# Check the documentations for more info about how Magic Mount works, and why you need this

# This is an example
REPLACE="
/system/app/Youtube
/system/priv-app/SystemUI
/system/priv-app/Settings
/system/framework
"

# Construct your own list here, it will override the example above
# !DO NOT! remove this if you don't need to replace anything, leave it empty as it is now
REPLACE="

"
#添加您要精简的APP/文件夹目录
#例如：精简状态栏，找到状态栏目录为  /system/priv-app/SystemUI/SystemUI.apk     
#转化加入:/system/priv-app/SystemUI
#（可以搭配高级设置获取APP目录）

##########################################################################################
# Permissions
##########################################################################################
#释放文件，普通shell命令
on_install() {
  ui_print "- 正在释放文件"
  unzip -o "$ZIPFILE" 'system/*' -d $MODPATH >&2
}

set_permissions() {
  # Only some special files require specific permissions
  # The default permissions should be good enough for most cases

  # Here are some examples for the set_perm functions:

  # set_perm_recursive  <dirname>                <owner> <group> <dirpermission> <filepermission> <contexts> (default: u:object_r:system_file:s0)
  # set_perm_recursive  $MODPATH/system/lib       0       0       0755            0644

  # set_perm  <filename>                         <owner> <group> <permission> <contexts> (default: u:object_r:system_file:s0)
  # set_perm  $MODPATH/system/bin/app_process32   0       2000    0755         u:object_r:zygote_exec:s0
  # set_perm  $MODPATH/system/bin/dex2oat         0       2000    0755         u:object_r:dex2oat_exec:s0
  # set_perm  $MODPATH/system/lib/libart.so       0       0       0644

  # The following is default permissions, DO NOT remove
  set_perm_recursive  $MODPATH  0  0  0755  0644
  
  #设置权限，基本不要去动
}

##########################################################################################
# Custom Functions
##########################################################################################

# This file (config.sh) will be sourced by the main flash script after util_functions.sh
# If you need custom logic, please add them here as functions, and call these functions in
# update-binary. Refrain from adding code directly into update-binary, as it will make it
# difficult for you to migrate your modules to newer template versions.
# Make update-binary as clean as possible, try to only do function calls in it.

MODDIR=${0%/*}

SKIPUNZIP=0
instead() {
sh $MODPATH/script/setup.sh
[ "$?" != "0" ] && abort
}
usescene() {
            rm -rf /storage/emulated/0/Android/yc
            rm -rf $MODPATH/bat/busybox
            rm -rf $MODPATH/bat/uperf
            rm -rf $MODPATH/system/vendor
            rm -rf $MODPATH/script
            rm -rf $MODPATH/upe
            rm -rf $MODPATH/2.sh
            rm -rf $MODPATH/uconfig
            rm -rf $MODPATH/cobb.sh
            rm -f $MODDULE_PATH/_GAMES.json
            rm -f $MODDULE_PATH/manifest.json 
            rm -f $MODDULE_PATH/profile.json 
}
useyc() {
            rm -rf /storage/emulated/0/Android/yc
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
            rm -rf $MODPATH/np.sh
            cat $MODPATH/upe/1.sh > $MODPATH/post-fs-data.sh
            cat $MODPATH/upe/3.sh > $MODPATH/service.sh
}
tuijian() {
    echo "音量上键  将一键安装推荐配置"
    echo "音量下键  启用个人个性化定制"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认一键安装推荐配置，请稍候" 
            echo "* 已为您一键安装推荐配置❤️" 
            echo "* 感谢您的支持与信任😁" 
            usescene
            check_required_files
            extract_bin
            remove_sys_perf_config
            installweb
            micleaning
            mv -f $MODPATH/deamons/*.txt /data/media/0/Android/
            ;;
        *)
            echo "❗已为您启用个人个性化定制" 
            echo "❤️快开始你的定制吧" 
            moyu
            appopt_check
            rmguh
            deamon
            micleaning
            ;;
    esac
}
deamon() {
    echo "音量上键  将启用无障碍守护"
    echo "音量下键  取消无障碍守护"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认启用无障碍守护，请稍候" 
            echo "* 已为您启用无障碍守护❤️" 
            echo "* 感谢您的支持与信任😁" 
            cp -f $MODPATH/deamons/*.txt /data/media/0/Android/
            ;;
        *)
            echo "❗非常遗憾" 
            echo "❗已为您取消启用无障碍守护" 
            rm -rf $MODPATH/ASGuard_main.sh
            rm -rf $MODPATH/deamon.sh
            rm -rf $MODPATH/deamons
            ;;
    esac
}

is_miui_device() {
    # 检查MIUI专有系统属性
    miui_version_code=$(getprop ro.miui.ui.version.code 2>/dev/null)
    miui_version_name=$(getprop ro.miui.ui.version.name 2>/dev/null)
    
    # 检查MIUI特征文件（路径可能因设备不同而变化）
    miui_build_prop=$(grep -q "miui" /system/build.prop 2>/dev/null; echo $?)
    miui_feature_dir="/system/etc/device_features"
    
    # 逻辑判断：满足任意MIUI特征即返回true
    if [ -n "$miui_version_code" ] || 
       [ -n "$miui_version_name" ] || 
       [ $miui_build_prop -eq 0 ] || 
       [ -d "$miui_feature_dir" ]; then
        return 0  # true
    else
        return 1  # false
    fi
}

# 主程序逻辑
miui_check() {
if is_miui_device; then
    echo "true"
else
    echo "This is NOT a MIUI device."
fi
}
moyu() {
    echo "音量上键  将使用摸鱼yc配置"
    echo "音量下键  使用scene版本配置"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认使用摸鱼版配置，请稍候" 
            echo "* 已为您配置yc❤️" 
            echo "* 感谢您的支持与信任😁" 
            useyc
            instead
            ;;
        *)
            echo "❗你已确认使用scene配置，请稍后" 
            echo "❗已为您配置scene❤️" 
            usescene
            ;;
    esac
}
rmguh() {
    echo "音量上键将scene转为系统应用"
    echo "音量下键取消scene转为系统应用"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认固化，请稍候" 
            echo "* 已为您将scene转为系统应用❤️" 
            echo "* 感谢您的支持与信任😁" 
            ;;
        *)
            echo "❗非常遗憾" 
            echo "❗已为您取消scene转为系统应用" 
            rm -rf $MODPATH/system/app
            ;;
    esac
}
appoptmv() {
    sh $MODPATH/cobb.sh
}
appopt_check() {
    echo "音量上键  将内置线程分配"
    echo "音量下键  取消内置线程分配"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认内置线程分配，请稍候" 
            echo "* 已为您内置线程分配❤️" 
            echo "* 感谢您的支持与信任😁" 
            check_required_files
            webcheck
            extract_bin
            remove_sys_perf_config
            appoptmv
            ;;
        *)
            echo "❗非常遗憾" 
            echo "❗已为您取消内置线程分配" 
            rm -rf $MODPATH/bin
            rm -rf $MODPATH/webroot
            rm -rf $MODPATH/applist.conf
            rm -rf $MODPATH/KsuWebUI.apk
            rm -rf $MODPATH/core.sh
            ;;
    esac
}
webcheck() {
    echo "音量上键  将添加线程分配插件控制"
    echo "音量下键  取消内置线程分配插件"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认内置线程分配，请稍候" 
            echo "* 已为您内置线程分配插件❤️" 
            echo "* 感谢您的支持与信任😁" 
            installweb
            ;;
        *)
            echo "❗非常遗憾" 
            echo "❗已为您取消内置线程分配插件" 
            rm -rf $MODPATH/webroot
            rm -rf $MODPATH/KsuWebUI.apk
            ;;
    esac
}
check_magisk_version() {
	if [ "$MAGISK_VER_CODE" -lt 20400 ]; then
		ui_print "**************************************************"
		ui_print "! 请安装 Magisk v20.4+ (20400+)"
		abort    "**************************************************"
	fi
}	
miclean(){
    echo "音量上键  将清理小米云控数据"
    echo "音量下键  取消清理小米云控数据"
count=10
    key_click=""
    while [ $count -gt 0 ] && [ -z "$key_click" ]; do
         sleep 0.3
         count=$((count - 1))
         key_click="$(timeout 0.1 getevent -qlc 1 2>/dev/null | awk '{ print $3 }' | grep 'KEY_')"
    done
    if [ -z "$key_click" ]; then
         key_click="KEY_VOLUMEDOWN"
    fi
    case "$key_click" in
        "KEY_VOLUMEUP")
            echo "❗您已确认清理小米云控数据，请稍候" 
            echo "* 已为您清理小米云控数据❤️" 
            echo "* 感谢您的支持与信任😁" 
            sh $UPMODPATH/script/miclean.sh
            ;;
        *)
            echo "❗你已确认取消清理小米云控数据，请稍后" 
            echo "❗已为您取消清理小米云控数据❤️" 
            ;;
    esac
}
micleaning(){
if [ "$(miui_check)" = "true" ]; then
miclean
else
echo "not support"
fi
}
installweb() {
if [ "$KSU" ] || [ "$APATCH" ]; then
    echo "检测到 KernelSU 环境，跳过 APK 安装操作。"
else
    echo "未检测到 KernelSU/Apatch 环境，开始执行 APK 安装操作。"

    # 检查 /data/adb/ksud 文件是否存在
    if [ -f "/data/adb/ksud" ]; then
        echo "检测到 ksud 文件，可能为 SukiSU，跳过 APK 安装操作。"
    else
        install_apk() {
            apk_file="$1"
            if [ -f "$apk_file" ]; then
                pm install -r "$apk_file"
                echo "软件安装成功."
            else
                echo "Error: $apk_file 未找到!"
            fi
        }
        install_apk "$MODPATH/KsuWebUI.apk"
    fi
fi
}
check_required_files() {
	REQUIRED_FILE_LIST="/sys/devices/system/cpu/present"
	for REQUIRED_FILE in $REQUIRED_FILE_LIST; do
		if [ ! -e $REQUIRED_FILE ]; then
			ui_print "**************************************************"
			ui_print "! $REQUIRED_FILE 文件不存在"
			ui_print "! 请联系模块作者"
			abort    "**************************************************"
		fi
	done
}
extract_bin() {
	ui_print "**************************************************"
	if [ "$ARCH" == "arm" ]; then
		cp $MODPATH/bin/armeabi-v7a/DeamOpt $MODPATH
	elif [ "$ARCH" == "arm64" ]; then
		cp $MODPATH/bin/arm64-v8a/DeamOpt $MODPATH
	elif [ "$ARCH" == "x86" ]; then
		cp $MODPATH/bin/x86/DeamOpt $MODPATH
	elif [ "$ARCH" == "x64" ]; then
		cp $MODPATH/bin/x86_64/DeamOpt $MODPATH
	else
		abort "! Unsupported platform: $ARCH"
	fi
	ui_print "- Device platform: $ARCH"
	rm -rf $MODPATH/bin
}
remove_sys_perf_config() {
	for SYSPERFCONFIG in $(ls /system/vendor/bin/msm_irqbalance); do
		[[ ! -d $MODPATH${SYSPERFCONFIG%/*} ]] && mkdir -p $MODPATH${SYSPERFCONFIG%/*}
		ui_print "- Config file:$SYSPERFCONFIG"
		touch $MODPATH$SYSPERFCONFIG
		ui_print "**************************************************"
	done
}

check_magisk_version
tuijian



set_perm_recursive $MODPATH 0 0 0755 0777
set_perm_recursive "$MODPATH/*.sh" 0 2000 0755 0755 u:object_r:magisk_file:s0
set_perm_recursive "$MODPATH/DeamsBegin" 0 2000 0755 0755

echo "❗切换配置后不要马上重启❗"
echo "❗切换配置后不要马上重启❗"
echo "❗切换配置后不要马上重启❗"
echo "❗yc切scene去scene里面切换lp\hp❗"
echo "❗首次使用scene配置先去scene里切换配置后重启❗"