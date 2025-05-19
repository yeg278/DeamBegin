#!/system/bin/sh
#
# Copyright (C) 2021-2022 Matt Yang
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libsysinfo.sh

# $1:error_message
abort() {
    echo "$1"
    echo "! Uperf installation failed."
    exit 1
}

# $1:file_node $2:owner $3:group $4:permission $5:secontext
set_perm() {
    chown $2:$3 $1
    chmod $4 $1
    chcon $5 $1
}

# $1:directory $2:owner $3:group $4:dir_permission $5:file_permission $6:secontext
set_perm_recursive() {
    find $1 -type d 2>/dev/null | while read dir; do
        set_perm $dir $2 $3 $4 $6
    done
    find $1 -type f -o -type l 2>/dev/null | while read file; do
        set_perm $file $2 $3 $5 $6
    done
}

install_uperf() {
    echo "- Finding platform specified config"
    echo "- ro.board.platform=$(getprop ro.board.platform)"
    echo "- ro.product.board=$(getprop ro.product.board)"

    local target
    local cfgname
    target="$(getprop ro.board.platform)"
    cfgname="$(get_config_name $target)"
    if [ "$cfgname" == "unsupported" ]; then
        target="$(getprop ro.product.board)"
        cfgname="$(get_config_name $target)"
    fi

    if [ "$cfgname" == "unsupported" ] || [ ! -f $MODULE_PATH/uconfig/$cfgname.json ]; then
        abort "! Target [$target] not supported."
    fi

    echo "- Uperf config is located at $USER_PATH"
    mkdir -p $USER_PATH
    mv -f $USER_PATH/uperf.json $USER_PATH/uperf.json.bak
    cp -f $MODULE_PATH/uconfig/$cfgname.json $USER_PATH/uperf.json
    [ ! -e "$USER_PATH/perapp_powermode.txt" ] && cp $MODULE_PATH/uconfig/perapp_powermode.txt $USER_PATH/perapp_powermode.txt
    rm -rf $MODULE_PATH/uconfig

    set_perm_recursive $BIN_PATH 0 0 0755 0755 u:object_r:system_file:s0
}

echo ""
echo "* Uperf https://github.com/yc9559/uperf/"
echo "* Author: Matt Yang (二改：枫)"
echo "* Version: 1.7"
echo "*我本楚狂人，凤歌笑孔丘。"
echo "*手持绿玉杖，朝别黄鹤楼。"
echo "*五岳寻仙不辞远，一生好入名山游。"
echo "*庐山秀出南斗傍，屏风九叠云锦张，"
echo "*影落明湖青黛光。"
echo "*金阙前开二峰长，银河倒挂三石梁。"
echo "*香炉瀑布遥相望，回崖沓嶂凌苍苍。"
echo "*翠影红霞映朝日，鸟飞不到吴天长。"
echo "*登高壮观天地间，大江茫茫去不还。"
echo "*黄云万里动风色，白波九道流雪山。"
echo "*好为庐山谣，兴因庐山发。"
echo "*闲窥石镜清我心，谢公行处苍苔没。"
echo "*早服还丹无世情，琴心三叠道初成。"
echo "*遥见仙人彩云里，手把芙蓉朝玉京。"
echo "*先期汗漫九垓上，愿接卢敖游太清。"
echo "*V1.7版本改动"
echo "*新适配sdm8g1+"
echo "*调整8g2功耗模型，8g2在hyperos游戏上出现的部分冲突未解决。"
echo "*均衡模式兼顾日常省电，能够应付绝大部分软件，稳定均衡功耗。"
echo "- Installing uperf"
install_uperf
