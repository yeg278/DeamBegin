#!/system/bin/sh
#
# Copyright (C) 2021-2022 Matt Yang & yinwanxi
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distriywxuted on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

###############################
# Platform info functions
###############################

# $1:"4.14" return:string_in_version
soc_model(){
soc_model=$(getprop ro.soc.model)
echo "$soc_model"
}

match_linux_version() {
    echo "$(cat /proc/version | grep -i "$1")"
}


get_socid() {
    if [ -f /sys/devices/soc0/soc_id ]; then
        echo "$(cat /sys/devices/soc0/soc_id)"
    else
        echo "$(cat /sys/devices/system/soc/soc0/id)"
    fi
}

get_nr_core() {
    echo "$(cat /proc/stat | grep cpu[0-9] | wc -l)"
}

# $1:cpuid
get_maxfreq() {
    echo "$(cat "/sys/devices/system/cpu/cpu$1/cpufreq/cpuinfo_max_freq")"
}

get_socname() {
    echo "$(cat "/sys/devices/soc0/machine"| tr '[A-Z]' '[a-z]')"
}

is_aarch64() {
    if [ "$(getprop ro.product.cpu.abi)" == "arm64-v8a" ]; then
        echo "true"
    else
        echo "false"
    fi
}

is_eas() {
    if [ "$(grep sched /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors)" != "" ]; then
        echo "true"
    else
        echo "false"
    fi
}

is_mtk() {
    local soc_model="$(getprop ro.soc.model)"
    local hw_check="$(getprop ro.hardware)
                    $(getprop ro.board.platform)
                    $(getprop ro.boot.hardware)
                    $(getprop ro.soc.manufacturer)
                    $soc_model"
                    
    local pattern='(mt[0-9]{4}|mediatek|dimensity|helio[ _-]g?[0-9]{2})'

    echo "$hw_check" | tr '[:upper:]' '[:lower:]' | grep -qE "$pattern"

    [ $? -eq 0 ] && echo "true" || echo "false"
}

miui_check(){
if [ "$(printf '%s\n' "90" "$(getprop ro.miui.ui.version.name)" | sort -V | head -n1)" = "90" ]; then
  echo "true"
else
  echo "false"
fi
}

_get_sm6150_type() {
    case "$(get_socid)" in
    365 | 366) echo "sdm730" ;;
    355 | 369) echo "sdm675" ;;
    esac
}

_get_sdm76x_type() {
    if [ "$(get_maxfreq 7)" -gt 2300000 ]; then
        echo "sdm765"
    else
        echo "sdm750"
    fi
}

_get_lahaina_type() {
    if [ "$(get_maxfreq 7)" -gt 2600000 ]; then
        echo "sdm888"
    else
        if [ "$(get_maxfreq 4)" -gt 2300000 ]; then
            echo "sdm778"
        else
            echo "sdm780"
        fi
    fi
}

_get_taro_type() {
    if [ "$(get_socname)" == cape ] || [ "$(get_socname)" == capep ] || [ "$(get_socname)" == ukee ] || [ "$(get_socname)" == ukeep ]; then
        echo "sdm8g1+"
    else
        if [ "$(get_socname)" == waipio ] || [ "$(get_socname)" == waipiop ]; then
            echo "sdm8g1"
        else
            echo "sdm7g1"
        fi
    fi
}

_get_pinekala_type() {
    if [ "$(soc_model)" == "SM8650" ]; then
            echo "sdm8g3"
        else
            echo "sdm7+g3"
        fi
}

_get_kalama_type() {
    if [ "$(get_maxfreq 7)" -gt 3300000 ]; then
        echo "sdm8cxg2"
        else
        echo "sdm8g2"
    fi
}

# $1:board_name
get_config_name() {
    case "$1" in
    "pineapple") echo "$(_get_pinekala_type)" ;;
    "kalama") echo "$(_get_kalama_type)" ;;
    "taro") echo "$(_get_taro_type)" ;;
    "lahaina") echo "$(_get_lahaina_type)" ;;
    "shima") echo "$(_get_lahaina_type)" ;;
    "yupik") echo "$(_get_lahaina_type)" ;;
    "sun") echo "sdm8g4" ;;
    "kona") echo "sdm865" ;;    # 865, 870
    "msmnile") echo "sdm855" ;; # 855, 860
    "sdm845") echo "sdm845" ;;
    "lito") echo "$(_get_sdm76x_type)" ;;
    "sm6150") echo "$(_get_sm6150_type)" ;;
    "holi") echo "sdm695" ;;
    "sdm710") echo "sdm710" ;;
    "msm8960") echo "sdm600" ;;
    "msm8939") echo "sdm616" ;;
    "msm8916") echo "sdm616" ;;
    "MSM8916") echo "sdm616" ;;
    "sky") echo "sdm4g2" ;;
    "parrot") echo "sdm4g2" ;;
    "msm8937") echo "sdm439" ;;
    "msm8953") echo "sdm625" ;;    # 625
    "msm8953pro") echo "sdm625" ;; # 626
    "msm8952Pro") echo "sdm653" ;; #653
    "msm8952") echo "sdm653" ;; #652
    "msm8976SG") echo "sdm653" ;; #653
    "sdm660") echo "sdm660" ;;
    "sdm636") echo "sdm660" ;;
    "trinket") echo "sdm665" ;; # sdm665
    "bengal") echo "sdm680" ;;  # sdm662
    "msm8956") echo "sdm650" ;;
    "curtana") echo "sdm720" ;;
    "msm8998") echo "sdm835" ;;
    "msm8996") echo "sdm820" ;;
    "msm8909") echo "sdm210" ;;
    "msm8996pro") echo "sdm820" ;;
    "exynos850") echo "e850" ;;
    "s5e9925") echo "e2200" ;;
    "exynos2100") echo "e2100" ;;
    "erd8835") echo "e1380" ;;
    "universal9925") echo "e2200" ;;
    "exynos1080") echo "e1080" ;;
    "exynos990") echo "e990" ;;
    "universal1080") echo "e1080" ;;
    "s5e9815") echo "e1080" ;;
    "erd9815_rt") echo "e1080" ;;
    "universal990") echo "e990" ;;
    "universal5420") echo "e5420" ;;
    "universal9825") echo "e9820" ;;
    "universal9820") echo "e9820" ;;
    "universal9810") echo "e9810" ;;
    "universal8895") echo "e8895" ;;
    "universal8890") echo "e8890" ;;
    "universal7420") echo "e7420" ;;
    "mt6580") echo "mt6580" ;;
    "mt6765") echo "mtp35" ;; # Helio P35(mt6765)/G35(mt6765g)/G37(mt6765h)
    "mt6768") echo "mtg80" ;; # Helio P65(mt6768)/G70(mt6769v)/G80(mt6769t)/G85(mt6769z)
    "mt6757") echo "mtp20" ;;
    "k57pv1_dm_64") echo "mtp20" ;;
    "mt6739") echo "mt6739" ;;
    "mt6761") echo "mta22" ;;
    "mt6771") echo "mtp70" ;;
    "mt8175") echo "mt8173" ;;
    "mt8173") echo "mt8173" ;;
    "mt6779") echo "mtp90" ;;
    "mt6789") echo "mtg99" ;;
    "mt6785") echo "mtg90t" ;;
    "Infinix-X6827") echo "mtg96" ;;
    "mt6827") echo "mtg96" ;;
    "mt6795") echo "mtx10" ;;
    "mt6797") echo "mtx20" ;;
    "mt6833") echo "mtd720" ;;
    "mt6833p") echo "mtd720" ;; # Dimensity 810
    "mt6833v") echo "mtd720" ;; # Dimensity 810
    "mt6835") echo "mtd6000" ;;
    "mt6853") echo "mtd720" ;;
    "mt6873") echo "mtd820" ;;
    "mt6875") echo "mtd820" ;;
    "mt6877") echo "mtd920" ;;
    "mt6855") echo "mtd930" ;;
    "cancunf") echo "mtd930" ;;
    "mt6885") echo "mtd1000" ;;
    "mt6886") echo "mtd7000" ;;
    "mt6878") echo "mtd7300" ;;
    "mt6889") echo "mtd1000" ;;
    "mt6891") echo "mtd1100" ;;
    "mt6893") echo "mtd1200" ;;
    "mt6895") echo "mtd8100" ;;
    "mt6897") echo "mtd8300" ;;
    "mt6983") echo "mtd9000" ;;
    "mt6985") echo "mtd9200" ;;
    "mt6989") echo "mtd9300" ;;
    "mt6991") echo "mtd9400" ;;
    "gs101") echo "gs101" ;;
    "gs201") echo "gs201" ;;
    "cheetah") echo "gs201" ;;
    "husky") echo "gs301" ;;
    "zuma") echo "gs301" ;;
    "shiba") echo "gs301" ;;
    "tokay") echo "gs401" ;;
    "comet") echo "gs401" ;;
    "caiman") echo "gs401" ;;
    "tokay") echo "gs401" ;;
    "komodo") echo "gs401" ;;
    "zumapro") echo "gs401" ;;
    "PRL") echo "kirin65x" ;;
    "BLN") echo "kirin65x" ;;
    "hi6250") echo "kirin65x" ;;
    "kirin655") echo "kirin65x" ;;
    "kirin658") echo "kirin65x" ;;
    "kirin659") echo "kirin65x" ;;
    "MAR") echo "kirin710" ;;
    "INE") echo "kirin710" ;;
    "ANE") echo "kirin710" ;;
    "JSN") echo "kirin710" ;;
    "kirin710") echo "kirin710" ;;
    "JKM-AL20") echo "kirin710" ;;
    "STF") echo "kirin960" ;;
    "HWI") echo "kirin960" ;;
    "kirin960") echo "kirin960" ;;
    "hi3660") echo "kirin960" ;;
    "CMR") echo "kirin960" ;;
    "BKL") echo "kirin970" ;;
    "ALP") echo "kirin970" ;;
    "COR") echo "kirin970" ;;
    "kirin970") echo "kirin970" ;;
    "ELE") echo "kirin980" ;;
    "kirin980") echo "kirin980" ;;
    "kirin990") echo "kirin990" ;;
    "LIO-AL00") echo "kirin990" ;;
    "OXP-AN00") echo "kirin990" ;;
    "ANA-AN00") echo "kirin990" ;;
    "ELS-AN10") echo "kirin990" ;;
    "EBG-AN00") echo "kirin990" ;;
    "TAS-AN00") echo "kirin990" ;;
    "LIO-AN00P") echo "kirin990" ;;
    "OXF-AN00") echo "kirin990" ;;
    "OCE-AL50") echo "kirin990" ;;
    "SCMR-W09") echo "kirin990" ;;
    "TAH-AN00m") echo "kirin990" ;;
    "kirin9000") echo "kirin9000" ;;
    "JAD") echo "kirin9000" ;;
    "hi3650") echo "kirin955" ;;
    "FRD") echo "kirin955" ;;
    "EVA-TL00") echo "kirin955" ;;
    "kirin955") echo "kirin955" ;;
    "sp9863a") echo "sp9863" ;;
    "ums312") echo "t310" ;;
    "ums9230") echo "t606" ;;
    "ums512") echo "t618" ;;
    "ud710") echo "t710" ;;
    "ums9620") echo "t770" ;;
    "sp9832e") echo "sp9832" ;;
    "ums312_2h10") echo "t310" ;;
    "ums9230_1h10") echo "t606" ;;
    "ums512_1h10") echo "t618" ;;
    "ud710_7h10") echo "t710" ;;
    "ums9620_2h10") echo "t770" ;;
    "sp9832e_1h10") echo "sp9832" ;;
    "sp9863a_1h10") echo "sp9863" ;;
    "tegra") echo "tegra" ;;
    "dragon") echo "tegra" ;;
    "tegraa210_dragon") echo "tegra" ;;
    *) echo "unsupported" ;;
    esac
}
