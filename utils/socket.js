/**
 * Real Time chatting app
 * 
 */
'use strict';

const path = require('path');
const helper = require('./helper');

class Socket {

    constructor(socket) {
        this.io = socket;
    }

    socketEvents() {

        this.io.on('connection', (socket) => {

            /**
             * get the user's Chat list
             */
            socket.on('chat-list', async(userId) => {

                let chatListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    chatListResponse.error = true;
                    chatListResponse.message = `User does not exits.`;

                    this.io.emit('chat-list-response', chatListResponse);
                } else {
                    const result = await helper.getChatList(userId, socket.id);
                    //console.log(result.chatlist);
                    this.io.to(socket.id).emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: false,
                        chatList: result.chatlist
                    });

                    socket.broadcast.emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: true,
                        chatList: result.userinfo
                    });
                }
            });
            /**
             * send the messages to the user
             */

            //for flutter
            socket.on('getMessages', async(data) => {
                //console.log(data);
                const result = await helper.getMessages(data.fromUserId, data.toUserId);


                //console.log(result);

                if (result === null) {
                    this.io.to(socket.id).emit('getMessagesResponse', { result: [], toUserId: data.toUserId });
                } else {
                    this.io.to(socket.id).emit('getMessagesResponse', { result: result, toUserId: data.toUserId })
                }
                //console.log(JSON.stringify(result));
                //console.log(result);
            });
            /* socket.on('getMessagesScene', async(data) => {
                 //console.log(data);
                 const result = await helper.getMessages(data.fromUserId, data.toUserId);


                 //console.log(result);

                 if (result === null) {
                     this.io.to(socket.id).emit('getMessagesSceneResponse', { result: [], toUserId: data.toUserId });
                 } else {
                     this.io.to(socket.id).emit('getMessagesSceneResponse', { result: result, toUserId: data.toUserId })
                 }
                 //console.log(JSON.stringify(result));
                 //console.log(result);
             });*/

            /*socket.on('addMessage', async(response) => {
                 //response.date = new moment().format("Y-MM-D");

                 //response.time = new moment().format("hh:mm A");

                 helper.insertMessages(response, socket);

                 socket.to(response.toSocketId).emit('addMessageResponse', response);

             });*/
            //end fo flutter

            socket.on('add-message', async(data) => {
                // console.log(data);
                //data.date = new moment().format("Y-MM-D");
                //data.time = new moment().format("hh:mm A");
                data.date = '2021-07-19';
                data.time = '11:30 AM';
                if (data.message === '') {

                    this.io.to(socket.id).emit(`add-message-response`, `Message cant be empty`);

                } else if (data.fromUserId === '') {

                    this.io.to(socket.id).emit(`add-message-response`, `Unexpected error, Login again.`);

                } else if (data.toUserId === '') {

                    this.io.to(socket.id).emit(`add-message-response`, `Select a user to chat.`);

                } else {
                    let toSocketId = data.toSocketId;
                    const sqlResult = await helper.insertMessages({
                        fromUserId: data.fromUserId,
                        toUserId: data.toUserId,
                        message: data.message,
                        date: data.date,
                        time: data.time
                    });
                    this.io.to(toSocketId).emit(`add-message-response`, data);
                    //console.log(data);
                }
            });


            /**
             * Logout the user
             */
            socket.on('logout', async() => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                this.io.to(socket.id).emit('logout-response', {
                    error: false
                });
                socket.disconnect();
            });


            /**
             * sending the disconnected user to all socket users. 
             */
            socket.on('disconnect', async() => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                setTimeout(async() => {
                    const isLoggedOut = await helper.isUserLoggedOut(socket.id);
                    if (isLoggedOut && isLoggedOut !== null) {
                        socket.broadcast.emit('chat-list-response', {
                            error: false,
                            userDisconnected: true,
                            socketId: socket.id
                        });
                    }
                }, 1000);
            });

        });

    }

    socketConfig() {

        this.io.use(async(socket, next) => {
            let userId = socket.request._query['userId'];
            let userSocketId = socket.id;
            const response = await helper.addSocketId(userId, userSocketId);
            if (response && response !== null) {
                next();
            } else {
                console.error(`Socket connection failed, for  user Id ${userId}.`);
            }
        });

        this.socketEvents();
    }
}
module.exports = Socket;