const WebSocket = require('ws');
var mysql = require('mysql');

const wss = new WebSocket.Server({ port: 7788 });

wss.on('connection', function connection(ws) {
    console.log("conected");

    ws.on('message', function incoming(message) {
        
        var parsed_message = JSON.parse(message);
        var cmd = parsed_message.cmd;

        var datetime = getDateTime();

        switch (cmd) {
            case 'sendlog':
                processData(parsed_message);

                var object = { ret: "sendlog", result: true, cloudtime: datetime };
                var json = JSON.stringify(object);
                console.log(json)
                ws.send(json);
                break;

            case 'reg':
                var object = { ret: "reg", result: true, cloudtime: datetime };
                var json = JSON.stringify(object);
                ws.send(json);
                break;

            case 'senduser':
                var object = { ret: "senduser", result: true, cloudtime: datetime };
                var json = JSON.stringify(object);
                ws.send(json);
                break;

            case 'settime':
                var object = { ret: "settime", result: true};
                var json = JSON.stringify(object);
                ws.send(json);
                break;

            default:
                console.log('Sorry');
        }

        console.log(message);
    });
});

function processData(data) {
    
    var db  = mysql.createPool({
      connectionLimit : 10,
      host            : 'localhost',
      user            : 'root',
      password        : 'panch123',
      database        : 'attendance'
    });
    
    db.getConnection(function(err, connection) {

        data.record.forEach(function(element){

            connection.query('SELECT `id`, `school_id` FROM `profile_teachers` WHERE `enrollid`=? LIMIT 1', [element.enrollid], (err, teacherRows) => {
                if (teacherRows.length) {

                    var teacherRowJson = JSON.parse(JSON.stringify(teacherRows[0]));
                    
                    var date = element.time.substring(0, 10);
                    connection.query('SELECT `id` FROM `attendances` WHERE `profile_teacher_id`=? and `date`=? LIMIT 1', [teacherRowJson.id, date], (err, rows) => {
                        
                        if (!rows.length) {
                            connection.query('INSERT INTO `attendances` (`entry`, `date`, `profile_teacher_id`, `school_id`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, NOW(), NOW())', [element.time, date, teacherRowJson.id, teacherRowJson.school_id], (err, result) => {
                            });
                        }else{
                            var attendanceRowJson = JSON.parse(JSON.stringify(rows[0]))
                            connection.query('UPDATE `attendances` SET departure=? WHERE id=? LIMIT 1', [element.time, attendanceRowJson.id], (err, result) => {
                            });
                        }
                    });                    
                }
            });
        });
        connection.release();
    });
}

function getDateTime(){
    var date = new Date();

    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);

    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}