var socketIO = require('socket.io');
var server = require('http').createServer().listen(7000, '0.0.0.0');
var io = socketIO.listen(server);//클라이언트 소켓에서 접속 시도를 리슨하여 클라이언트와 연결
var connectCount = 0;//현재 접속자 수
console.log("port: 7000 listening");
// Super simple server:
//  * One room only.
//  * We expect two people max.
//  * No error handling.



io.sockets.on('connection', function (client) {
    console.log('new connection: ' + client.id);
    connectCount += 1;//접속자 수 +1
    console.log('client count:'+connectCount);
    client.emit('requireroomname',{});//클라이언트 소켓이 생성되면 바로 방 이름 요청

    client.on('sendroomname', function(roomName){
        console.log('방이름:'+roomName.roomName);
        client.join(roomName.roomName);
        // var room = io.adapter.rooms[roomName.roomName];
        // console.log(room);
        console.log(roomName.roomName+"참여자 수: "+io.sockets.adapter.rooms[roomName.roomName].length);
        //broadcast는 자신을 제외한 사람들에게 방송을 하는 것이기 때문에 두번째로 들어온 사람이 첫번째로 들어온 사람에게 방송을 하게 된다.
        //그럼 client에서는 createoffer라는 키로 된 리스너를 듣게 되고 offer를 두번째로 들어온 사람에게 보내게 된다.
        client.broadcast.to(roomName.roomName).emit('createoffer', {});
    });

    client.on('offer', function (details) {//수신자에게 발신자가 offer
        client.broadcast.to(details.roomName).emit('offer', details);//offer to receiver
        console.log('offer: ' + JSON.stringify(details));
    });

    client.on('answer', function (details) {//발신자에게 수신자가 answer
        client.broadcast.to(details.roomName).emit('answer', details);//answer to sender
        console.log('answer: ' + JSON.stringify(details));
    });

    client.on('candidate', function (details) {//ice candidate exchange
        client.broadcast.to(details.roomName).emit('candidate', details);//send candidate to remote peer
        console.log('candidate: ' + JSON.stringify(details));
    });

    client.on('switchcamera', function (details) {//상대방이 카메라를 전환했음을 알리는 경우
        client.broadcast.to(details.roomName).emit('switchcamera', details);
    });

    client.on('notifydepart', function (details) {//상대방이 화면을 벗어났음을 알리는 경우
       client.broadcast.to(details.roomName).emit('notifydepart', {});
    });

    client.on('notifygetback', function (details) {//상대방이 화면에 돌아왔음을 알리는 경우
        client.broadcast.to(details.roomName).emit('notifygetback', {});
    });

    client.on('endcall', function(details) {
        client.broadcast.to(details.roomName).emit('endcall', {});
    });

    client.on('disconnect', function(details){
        connectCount -= 1;
        console.log('disconnected');
        console.log('client count:'+connectCount);
    });
});
