import React, { Component } from 'react'
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
    Modal,
    ActivityIndicator,
    Image,
    ProgressBarAndroid
} from 'react-native'

import Toast from '@remobile/react-native-toast'
import BluetoothSerial from 'react-native-cabin-bluetooth-serial'
// import { Buffer } from 'buffer'
// global.Buffer = Buffer
const iconv = require('iconv-lite')

const Button = ({ title, onPress, style, textStyle }) =>
    <TouchableOpacity style={[ styles.button, style ]} onPress={onPress}>
      <Text style={[ styles.buttonText, textStyle ]}>{title.toUpperCase()}</Text>
    </TouchableOpacity>


const DeviceList = ({ devices, connectedId, showConnectedIcon, onDevicePress,enabled }) => {
    return (
        <ScrollView style={styles.container}>
          <View style={styles.listContainer} enabled={enabled}>
              {devices.map((device, i) => {
                  return (
                      <TouchableHighlight
                          underlayColor='#DDDDDD'
                          key={`${device.id}_${i}`}
                          style={styles.listItem} onPress={() => onDevicePress(device)}>
                        <View style={{flexDirection: 'row'}}>
                            {showConnectedIcon
                                ? (
                                    <View style={{width: 48, height: 48, opacity: 0.4}}>
                                        {connectedId === device.id
                                            ? (
                                                <Image style={{resizeMode: 'contain', width: 24, height: 24, flex: 1}}
                                                       source={require('./images/ic_done_black_24dp.png')}/>
                                            ) : null}
                                    </View>
                                ) : null}
                          <View style={{justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={{fontWeight: 'bold'}}>{device.name}</Text>
                            <Text>{`<${device.id}>`}</Text>
                          </View>
                        </View>
                      </TouchableHighlight>
                  )
              })}
          </View>
        </ScrollView>
    );
}
class BluetoothSerialExample extends Component {
    constructor (props) {
        super(props)
        this.state = {
            isEnabled: false,
            discovering: false,
            devices: [],
            unpairedDevices: [],
            connecting:false,
            connected: false,
            section: 0,
            data:null,
        }
    }

    componentWillMount () {
        Promise.all([
            BluetoothSerial.isEnabled(),
            BluetoothSerial.list()
        ])
            .then((values) => {
                const [ isEnabled, devices ] = values
                this.setState({ isEnabled, devices })
            })
        //\r\n
        BluetoothSerial.withDelimiter('\r\n').then((res)=>{
            console.log("delimiter setup",res);
            BluetoothSerial.on('read',(data)=>{
                //console.log('读取的数据',data.length>31&&data.substring(20,31));
                this.setState({data:data});
                console.log('读取的数据',data.data&&data.data.substring(20,31));
                // Toast.showShortCenter(data);
            })
        })
        BluetoothSerial.on('bluetoothEnabled', () => Toast.showShortBottom('蓝牙已启用'))
        BluetoothSerial.on('bluetoothDisabled', () => Toast.showShortBottom('蓝牙已关闭'))
        BluetoothSerial.on('error', (err) => console.log(`错误: ${err.message}`))
        BluetoothSerial.on('connectionLost', () => {
            if (this.state.device) {
                Toast.showLongCenter(`与设备： ${this.state.device.name} 的连接已丢失，请启动TVA后再次连接手机蓝牙`)
            }
            this.setState({ connected: false })
        })
    }

    /**
     * [android]
     * request enable of bluetooth from user
     */
    requestEnable () {
        BluetoothSerial.requestEnable()
            .then((res) => this.setState({ isEnabled: true }))
            .catch((err) => Toast.showShortBottom(err.message))
    }

    /**
     * [android]
     * enable bluetooth on device
     */
    enable () {
        BluetoothSerial.enable()
            .then((res) => this.setState({ isEnabled: true }))
            .catch((err) => Toast.showShortBottom(err.message))
    }

    /**
     * [android]
     * disable bluetooth on device
     */
    disable () {
        BluetoothSerial.disable()
            .then((res) => this.setState({ isEnabled: false }))
            .catch((err) => Toast.showShortBottom(err.message))
    }

    /**
     * [android]
     * toggle bluetooth
     */
    toggleBluetooth (value) {
        if (value === true) {
            this.enable()
        } else {
            this.disable()
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    discoverUnpaired () {
        if (this.state.discovering) {
            return false
        } else {
            this.setState({ discovering: true })
            BluetoothSerial.discoverUnpairedDevices()
                .then((unpairedDevices) => {
                    this.setState({ unpairedDevices, discovering: false })
                })
                .catch((err) => Toast.showShortBottom(err.message))
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    cancelDiscovery () {
        if (this.state.discovering) {
            BluetoothSerial.cancelDiscovery()
                .then(() => {
                    this.setState({ discovering: false })
                })
                .catch((err) => Toast.showShortBottom(err.message))
        }
    }

    /**
     * [android]
     * Pair device
     */
    pairDevice (device) {
        BluetoothSerial.pairDevice(device.id)
            .then((paired) => {
                if (paired) {
                    Toast.showShortBottom(`设备 ${device.name} 配对成功`)
                    const devices = this.state.devices
                    devices.push(device)
                    this.setState({ devices, unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id) })
                } else {
                    Toast.showShortBottom(`设备 ${device.name} 配对失败`)
                }
            })
            .catch((err) => Toast.showShortBottom(err.message))
    }

    /**
     * Connect to bluetooth device by id
     * @param  {Object} device
     */
    connect (device) {
        this.setState({ connecting: true })
        BluetoothSerial.isConnected().then(isConnected=>{
            if (isConnected){
                Toast.showShortBottom('已连接');
            }else{
                this.setState({connecting:true});
                BluetoothSerial.connect(device.id).then(info=>{
                    Toast.showShortBottom(`已连接到设备 ${device.name}`)
                    this.setState({ device, connected: true, connecting: false })
                }).catch((err)=>Toast.showShortBottom(err.message))
            }
        })
    }

    /**
     * Disconnect from bluetooth device
     */
    disconnect () {
        BluetoothSerial.disconnect()
            .then(() => this.setState({ connected: false }))
            .catch((err) => Toast.showShortBottom(err.message))
    }

    /**
     * Toggle connection when we have active device
     * @param  {Boolean} value
     */

    toggleConnect (device) {
        if (!this.state.connected) {
            this.connect(device)
        } else {
            this.disconnect()
        }
    }

    /**
     * Write message to device
     * @param  {String} message
     */
    write (message) {
        if (!this.state.connected) {
            Toast.showShortBottom('请先连接设备')
        }

        BluetoothSerial.write(message)
        // BluetoothSerial.writeTextToDevice(message)
            .then((res) => {
                Toast.showShortBottom('向设备写命令成功')
                this.setState({ connected: true })
            })
            .catch((err) => Toast.showShortBottom(err.message))
    }

    onDevicePress (device) {
        if (this.state.section === 0) {
            this.connect(device)
            //  this.toggleConnect(device);
        } else {
            this.pairDevice(device)
        }
    }

    // writePackets (message, packetSize = 64) {
    //     const toWrite = iconv.encode(message, 'cp852')
    //     const writePromises = []
    //     const packetCount = Math.ceil(toWrite.length / packetSize)
    //
    //     for (var i = 0; i < packetCount; i++) {
    //         const packet = new Buffer(packetSize)
    //         packet.fill(' ')
    //         toWrite.copy(packet, 0, i * packetSize, (i + 1) * packetSize)
    //         writePromises.push(BluetoothSerial.write(packet))
    //     }
    //
    //     Promise.all(writePromises)
    //         .then((result) => {
    //         })
    // }
    sendDirective=(directive)=>{
        console.log('向设备发送指令',directive)
        //this.write(directive+'<CR><LF>')
        this.write(directive+'\r\n')
    }

    readData=()=>{
        Toast.showShortBottom(`读取的数据为`)
    }

    render () {
        let {data}=this.state;
        const activeTabStyle = { borderBottomWidth: 6, borderColor: '#009688' }
        return (
            <View style={{ flex: 1 }}>
              <View style={styles.topBar}>
                <Text style={styles.heading}>蓝牙串口示例</Text>
                  {Platform.OS === 'android'
                      ? (
                          <View style={styles.enableInfoWrapper}>
                            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
                                {this.state.isEnabled ? '开' : '关'}
                            </Text>
                            <Switch
                                onValueChange={this.toggleBluetooth.bind(this)}
                                value={this.state.isEnabled} />
                          </View>
                      ) : null}
              </View>

                {Platform.OS === 'android'
                    ? (
                        <View style={[styles.topBar, { justifyContent: 'center', paddingHorizontal: 0 }]}>
                          <TouchableOpacity style={[styles.tab, this.state.section === 0 && activeTabStyle]} onPress={() => this.setState({ section: 0 })}>
                            <Text style={{ fontSize: 14, color: '#FFFFFF' }}>已配对设备</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.tab, this.state.section === 1 && activeTabStyle]} onPress={() => this.setState({ section: 1 })}>
                            <Text style={{ fontSize: 14, color: '#FFFFFF' }}>未配对设备</Text>
                          </TouchableOpacity>
                        </View>
                    ) : null}
                {this.state.discovering && this.state.section === 1
                    ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <ActivityIndicator
                              style={{ marginBottom: 15 }}
                              size={60} />
                          <Button
                              textStyle={{ color: '#FFFFFF' }}
                              style={styles.buttonRaised}
                              title='取消搜索'
                              onPress={() => this.cancelDiscovery()} />
                        </View>
                    ) : (
                        <DeviceList
                            showConnectedIcon={this.state.section === 0&&this.state.connected}
                            connectedId={this.state.device && this.state.device.id}
                            devices={this.state.section === 0 ? this.state.devices : this.state.unpairedDevices}
                            onDevicePress={(device) => this.onDevicePress(device)}
                            enabled={!this.state.connecting}
                        />
                    )}
                {data&&<Text>{`FID:${data.data.substring(20,31)}`} </Text>}
                {this.state.connecting&&<ProgressBarAndroid color='red' styleAttr='Inverse'/>}
              <View style={{flex:1,flexDirection:'row'}}>
                <ScrollView
                    horizontal
                    contentContainerStyle={styles.directivPanel}>
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='pid'*/}
                    {/*onPress={() => this.sendDirective('detector pid')} />*/}
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='fid'*/}
                    {/*onPress={() => this.sendDirective('detector fid')} />*/}
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='pid_fid'*/}
                    {/*onPress={() => this.sendDirective('detector pid_fid')} />*/}

                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='screen'*/}
                    {/*onPress={() => this.sendDirective('screen')} />*/}
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='1'*/}
                    {/*onPress={() => this.sendDirective('push 1')} />*/}

                  <Button
                      textStyle={{ color: '#FFFFFF' }}
                      style={styles.buttonRaised}
                      title='打开泵'
                      onPress={() => this.sendDirective('pump on')} />

                  <Button
                      textStyle={{ color: '#FFFFFF' }}
                      style={styles.buttonRaised}
                      title='关闭泵'
                      onPress={() => this.sendDirective('pump off')} />

                  <Button
                      textStyle={{ color: '#FFFFFF' }}
                      style={styles.buttonRaised}
                      title='点火'
                      onPress={() => this.sendDirective('ignite')} />
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='开始'*/}
                    {/*onPress={() => this.sendDirective('log start')} />*/}
                    {/*<Button*/}
                    {/*textStyle={{ color: '#FFFFFF' }}*/}
                    {/*style={styles.buttonRaised}*/}
                    {/*title='结束'*/}
                    {/*onPress={() => this.sendDirective('log stop')} />*/}
                </ScrollView>
              </View>
              <View style={{ alignSelf: 'flex-end', height: 52 }}>
                <ScrollView
                    horizontal
                    contentContainerStyle={styles.fixedFooter}>
                    {Platform.OS === 'android' && this.state.section === 1
                        ? (
                            <Button
                                title={this.state.discovering ? '... 搜索中' : '搜索设备'}
                                onPress={this.discoverUnpaired.bind(this)} />
                        ) : null}
                    {Platform.OS === 'android' && !this.state.isEnabled
                        ? (
                            <Button
                                title='打开蓝牙'
                                onPress={() => this.requestEnable()} />
                        ) : null}
                </ScrollView>
              </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: '#F5FCFF'
    },
    topBar: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' ,
        elevation: 6,
        backgroundColor: '#7B1FA2'
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 16,
        alignSelf: 'center',
        color: '#FFFFFF'
    },
    enableInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    tab: {
        alignItems: 'center',
        flex: 0.5,
        height: 56,
        justifyContent: 'center',
        borderBottomWidth: 6,
        borderColor: 'transparent'
    },
    connectionInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25
    },
    connectionInfo: {
        fontWeight: 'bold',
        alignSelf: 'center',
        fontSize: 18,
        marginVertical: 10,
        color: '#238923'
    },
    listContainer: {
        borderColor: '#ccc',
        borderTopWidth: 0.5
    },
    listItem: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        borderColor: '#ccc',
        borderBottomWidth: 0.5,
        justifyContent: 'center'
    },
    directivPanel:{
        flexDirection: 'row',
        justifyContent:'space-between',
        alignItems: 'center',
        paddingHorizontal: 5
    },
    fixedFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    button: {
        height: 36,
        margin: 5,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#7B1FA2',
        fontWeight: 'bold',
        fontSize: 14
    },
    buttonRaised: {
        backgroundColor: '#7B1FA2',
        borderRadius: 2,
        elevation: 2
    }
})

export default BluetoothSerialExample

