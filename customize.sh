#!/system/bin/sh
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
            sh $MODPATH/script/setup.sh
            rm -rf $MODPATH/np.sh
            cat $MODPATH/upe/1.sh > $MODPATH/post-fs-data.sh
            cat $MODPATH/upe/2.sh > $MODPATH/service.sh
            ;;
        *)
            echo "❗你已确认使用scene配置，请稍后" 
            echo "❗已为您配置scene❤️" 
            rm -rf $MODPATH/bat/busybox
            rm -rf $MODPATH/bat/uperf
            rm -rf $MODPATH/system/vendor
            rm -rf $MODPATH/upe
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
		cp $MODPATH/bin/armeabi-v7a/AppOpt $MODPATH
	elif [ "$ARCH" == "arm64" ]; then
		cp $MODPATH/bin/arm64-v8a/AppOpt $MODPATH
	elif [ "$ARCH" == "x86" ]; then
		cp $MODPATH/bin/x86/AppOpt $MODPATH
	elif [ "$ARCH" == "x64" ]; then
		cp $MODPATH/bin/x86_64/AppOpt $MODPATH
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
moyu
check_magisk_version
appopt_check
rmguh

set_perm_recursive $MODPATH 0 0 0755 0777
set_perm_recursive "$MODPATH/*.sh" 0 2000 0755 0755 u:object_r:magisk_file:s0
set_perm_recursive "$MODPATH/DeamsBegin" 0 2000 0755 0755

