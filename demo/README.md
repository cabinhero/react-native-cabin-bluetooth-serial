Demo应用说明：

1、需要安装react-native-toast插件，git地址
https://github.com/remobile/react-native-toast

2、运行时出错：
Native module Toast tried to override Toast for module.....

解决办法：在com.remobile.toast.Toast.java里添加下列代码
@Override
    public boolean canOverrideExistingModule() {
        return true;
    }
