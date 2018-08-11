react-native-cabin-bluetooth-serial
项目中引用
1、在package.json中添加：
"react-native-cabin-bluetooth-serial": "https://github.com/cabinhero/react-native-cabin-bluetooth-serial.git",
2、在settings.gradle里添加
include ':react-native-cabin-bluetooth-serial'
project(':react-native-cabin-bluetooth-serial').projectDir = new File(settingsDir, '../node_modules/react-native-cabin-bluetooth-serial')
3、在app的build.gradle里添加
compile project(':react-native-cabin-bluetooth-serial')
4、在MainApplication.java里注册组件
import com.cabin.CRCTBluetoothSerial.CRCTBluetoothSerialPackage;
@Override
protected List<ReactPackage> getPackages() {
  return Arrays.<ReactPackage>asList(
      new MainReactPackage(),
        new RCTToastPackage(),
          new CRCTBluetoothSerialPackage()
  );
}

