scene="com.omarea.vtools"
daemon="scene-daemon"

current_dir=$(dirname $0)
origin_path="$current_dir/$daemon"

if [[ ! -e "$origin_path" ]];then
  echo $origin_path
  echo "Scene's daemon not found !"
  exit 1
fi

dumpsys deviceidle whitelist +$scene 2>&1 >/dev/null
cmd appops set $scene RUN_IN_BACKGROUND allow 2>&1 >/dev/null
am set-standby-bucket --user 0 $scene active 2>&1 >/dev/null
am set-inactive com.omarea.vtools false 2>&1 >/dev/null

# toolkit_dir=$(pwd)/toolkit
toolkit_dir=$(dirname "$0")/toolkit
touch "/cache/USER-NAME" 2> /dev/null
if [[ "$?" == "0" ]] || [[ "$USER" == "ROOT" ]] || [[ "$USER" == "root" ]]; then
  if [[ $(echo $PATH | grep 'toolkit') == '' ]] && [[ -d "$toolkit_dir" ]]; then
    # echo '> Set PATH' 'PATH'=$PATH
    export PATH=$PATH:$toolkit_dir
  else
    # echo '> Set PATH, Skip'
    # echo 'PATH='$PATH
    echo 'TOOLKIT_DIR'=$toolkit_dir
  fi
  echo ''
  ksu=/data/adb/ksu/bin
  if [[ -d $ksu ]] && [[ $(magisk -V) == "" ]]; then
    export KSU=true
    if [[ $(echo $PATH | grep $ksu) == "" ]]; then
      export PATH=$PATH:$ksu
    fi
    echo '> Set KSU=true'
  fi
  if [[ "$1" == "debug" ]]; then
    echo 'Scene-Daemon Starting……'
    $origin_path
  else
    # $origin_path > /cache/scene.log
    nohup $origin_path >/dev/null 2>&1 &
    echo 'Scene-Daemon OK!'
  fi
else
  cache_dir="/data/local/tmp"

  current_process=`pgrep -f $daemon`
  if [[ ! "$current_process" == "" ]]; then
    echo 'Kill Current Scene-Daemon >>'
    kill -9 $current_process 2>/dev/null
  fi

  echo ''
  toolkit=$cache_dir/toolkit
  mkdir -p $toolkit
  # Env PATH add /data/local/tmp
  export PATH=$PATH:$toolkit

  if [[ -f "$current_dir/toolkit/toybox-outside" ]]; then
    echo 'Copy ToyBox'
    cp "$current_dir/toolkit/toybox-outside" $toolkit/toybox-outside
    chmod 777 $toolkit/toybox-outside
  fi
  if [[ -f "$current_dir/busybox" ]] && [[ ! -f $toolkit/busybox ]]; then
    echo 'Copy BusyBox'
    cp "$current_dir/busybox" $toolkit/busybox
    chmod 777 $toolkit/busybox

    echo 'Install BusyBox……'
    cd $toolkit
    for applet in `./busybox --list`; do
      case "$applet" in
      "sh"|"busybox"|"shell"|"swapon"|"swapoff"|"mkswap")
        echo '  Skip' > /dev/null
      ;;
      *)
        ./busybox ln -sf busybox "$applet";
      ;;
      esac
    done
    ./busybox ln -sf busybox busybox_1_34_1
  fi


  target_path="$cache_dir/$daemon"
  echo "Origin File: " $origin_path
  echo "Target File: " $target_path
  echo ''

  cp $origin_path $target_path
  chmod 777 $target_path
  nohup $target_path >/dev/null 2>&1 &
  if [[ $(pgrep scene-daemon) != "" ]]; then
    echo 'Scene-Daemon OK! ^_^'
  else
    echo 'Scene-Daemon Fail! @_@'
  fi

  cmd package compile -m speed $scene >/dev/null 2>&1 &
fi

