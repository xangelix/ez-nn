/*jshint esversion: 6*/

var isWin = process.platform === "win32";
var child;

$(() => {
  $('#testPic').click(() => {
    var spawn = require('child_process').spawn;
    if (isWin) {
      child = spawn('cmd', ['/c', `cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=tf_files/flower_photos/daisy/21652746_cc379e0eea_m.jpg`]);
    } else {
      child = spawn('bash', ['-c', `cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=tf_files/flower_photos/daisy/21652746_cc379e0eea_m.jpg`]);
    }


      child.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        document.getElementById("log").innerHTML += data.toString();
      });

      child.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
      });

      child.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
      });
  });
});
