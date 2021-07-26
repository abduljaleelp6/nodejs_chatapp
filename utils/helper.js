/**
 * Real Time chatting app
 * 
 */

'user strict';
const DB = require('./db');

class Helper {

    constructor(app) {
        this.db = DB;
    }

    async userNameCheck(username) {
        return await this.db.query(`SELECT count(username) as count FROM user WHERE LOWER(username) = ?`, `${username}`);
    }

    async registerUser(params) {
        try {
            return await this.db.query("INSERT INTO user (`username`,`password`,`online`) VALUES (?,?,?)", [params['username'], params['password'], 1]);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async loginUser(params) {
        try {

            return await this.db.query(`SELECT id,business_logo FROM user join business on business.BID=user.BID WHERE LOWER(business_email) = ? AND business_password = ?`, [params.username, params.password]);
            //return await this.db.query(`SELECT id,business_logo FROM user join business on business.BID=user.BID WHERE LOWER(username) = ? AND password = ?`, [params.username, params.password]);

            //return await this.db.query(`SELECT id FROM user WHERE LOWER(username) = ? AND password = ?`, [params.username,params.password]);
        } catch (error) {
            return null;
        }
    }

    async userSessionCheck(userId) {
        try {
            /*const result = await this.db.query(`SELECT online,username,business_logo,business_name FROM user join business on business.BID=user.BID WHERE id = ? AND online = ?`, [userId, 1]);
            if (result !== null) {
                //return result[0]['business_name'];
                return result[0]['business_logo'];
            } else {
                return null;
            }*/
            return await this.db.query(`SELECT online,username,business_logo,business_name FROM user join business on business.BID=user.BID WHERE id = ? AND online = ?`, [userId, 1]);

        } catch (error) {
            return null;
        }
    }

    async addSocketId(userId, userSocketId) {
        try {
            return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE id = ?`, [userSocketId, 1, userId]);
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async isUserLoggedOut(userSocketId) {
        try {
            return await this.db.query(`SELECT online FROM user WHERE socketid = ?`, [userSocketId]);
        } catch (error) {
            return null;
        }
    }

    async logoutUser(userSocketId) {
        return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE socketid = ?`, ['', 0, userSocketId]);
    }

    getChatList(userId, userSocketId) {
        console.log(userId, userSocketId);
        try {
            return Promise.all([
                // this.db.query(`SELECT id,username,online,socketid FROM user WHERE id = ?`, [userId]),
                // this.db.query(`SELECT id,username,online,socketid FROM user WHERE online = ? and socketid != ?`, [1, userSocketId])
                this.db.query(`SELECT id,username,online,socketid,business_logo,business_name FROM user join business on business.BID=user.BID WHERE id = ?`, [userId]),
                //this.db.query(`SELECT id,username,online,socketid,business_logo,business_name FROM user join business on business.BID=user.BID WHERE online = ? and socketid != ?`, [1, userSocketId])
                this.db.query(`SELECT id,username,online,socketid,business_logo,business_name FROM user join business on business.BID=user.BID WHERE online = ? and id != ?`, [1, userId])


            ]).then((response) => {
                return {
                    userinfo: response[0].length > 0 ? response[0][0] : response[0],
                    chatlist: response[1]
                };
            }).catch((error) => {
                console.warn(error);
                return (null);
            });
        } catch (error) {
            console.warn(error);
            return null;
        }
    }
    async updateMessagesScene(params) {
        try {
            return await this.db.query(`UPDATE message SET scene_status = 1 WHERE from_user_id = ? AND to_user_id = ?`, [params.toUserId, params.fromUserId]);

        } catch (error) {
            console.warn(error);
            return null;
        }
    }
    async insertMessages(params) {
        try {
            this.db.query(`UPDATE message SET scene_status = 1 WHERE from_user_id = ? AND to_user_id = ?`, [params.toUserId, params.fromUserId]);
            return await this.db.query(
                "INSERT INTO message (`from_user_id`,`to_user_id`,`message`,`date`,`time`) values (?,?,?,?,?)", [params.fromUserId, params.toUserId, params.message, params.date, params.time]
            );
        } catch (error) {
            console.warn(error);
            return null;
        }
    }

    async getMessages(userId, toUserId) {
        try {
            this.db.query(`UPDATE message SET scene_status = 1 WHERE from_user_id = ? AND to_user_id = ?`, [userId, toUserId]);

            return await this.db.query(
                `SELECT id,from_user_id as fromUserId,to_user_id as toUserId,message,date,time,message_status,scene_status FROM message WHERE 
					(from_user_id = ? AND to_user_id = ? )
					OR
					(from_user_id = ? AND to_user_id = ? )	ORDER BY id ASC				
				`, [userId, toUserId, toUserId, userId]
            );
        } catch (error) {
            console.warn(error);
            return null;
        }
    }
    getMessagesFlutter(userId, toUserId) {

        try {
            return Promise.all([
                this.db.query(
                    `SELECT id,from_user_id as fromUserId,to_user_id as toUserId,message FROM message WHERE 
                        (from_user_id = ? AND to_user_id = ? )
                        OR
                        (from_user_id = ? AND to_user_id = ? )	ORDER BY id ASC				
                    `, [userId, toUserId, toUserId, userId]
                )

            ]).then((response) => {
                return {

                    messagelist: response[0]
                };
            }).catch((error) => {
                console.warn(error);
                return (null);
            });
        } catch (error) {
            console.warn(error);
            return null;
        }
    }
}
module.exports = new Helper();