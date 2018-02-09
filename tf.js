/*jshint esversion: 6*/

var isWin = process.platform === "win32";
var child;
var child1;
var child2;


$(() => {
  $('.createNeuralNetwork').hide();
  $('.loading').hide();
  $('.testPic').hide();

  // Logs all package info
  /*
  function npmls(cb) {
    require('child_process').exec('npm ls --json', function(err, stdout, stderr) {
      if (err) return cb(err);
      cb(null, JSON.parse(stdout));
    });
  }
  npmls(console.log);
  */

  function scrollLog() {
    $('#log').scrollTop = $('#log').scrollHeight;
  }


  $('#startTensorBoard').click(() => {
    $('.startTensorBoard').hide();
    $('.loading').show();

    var spawn = require('child_process').spawn;
    if (isWin) {
      child = spawn('cmd', ['/c', `cd tf/ && activate tensorflow && tensorboard --logdir tf_files/training_summaries &`]);
    } else {
      child = spawn('bash', ['-c', `cd tf/ && source ~/tensorflow/bin/activate
      && tensorboard --logdir tf_files/training_summaries &`]);
    }

      child.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        document.getElementById("log").innerHTML += data.toString();
      });

      child.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
        if (data.includes(`(Press CTRL+C to quit)`)) {
          $('.loading').hide();
          $('.createNeuralNetwork').show();
        }
        $('#log').append(data.toString());
      });

      child.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
      });
  });

  $('#testPic').click(() => {

    const {dialog} = require('electron').remote;

    dialog.showOpenDialog({ filters: [ { name: 'JPG Images', extensions: ['jpg'] } ] }, (data) => {
      var spawn1 = require('child_process').spawn;
      if (isWin) {
        console.log(`cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=` + data);
        child1 = spawn1('cmd', ['/c', `cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=` + data]);
      } else {
        child1 = spawn1('bash', ['-c', `cd tf/ && python -m scripts.label_image
        --graph=tf_files/retrained_graph.pb
        --image=${data}`]);
      }

        child1.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
          $('#log').append(data.toString());
          scrollLog();
        });

        child1.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
        });

        child1.on('exit', function (code) {
          console.log('child process exited with code ' + code.toString());
        });
    });

  });

  $('#createNeuralNetwork').click(() => {
    $('#createNeuralNetwork').hide();
    var imageSize = '224';
    var architecture = '0.50';
    var steps = '500';
    var imageDir = 'tf_files/flower_photos';

    var spawn2 = require('child_process').spawn;
    if (isWin) {
      child2 = spawn2('cmd', ['/c', 'cd tf/ && python -m scripts.retrain --bottleneck_dir=tf_files/bottlenecks --how_many_training_steps=' + steps + ' --model_dir=tf_files/models/ --summaries_dir=tf_files/training_summaries/mobilenet_' + architecture + '_' + imageSize + ' --output_graph=tf_files/retrained_graph.pb --output_labels=tf_files/retrained_labels.txt --architecture=mobilenet_' + architecture + '_' + imageSize + ' --image_dir=tf_files/flower_photos']);
    } else {
      child2 = spawn2('bash', ['-c', `cd tf/ && python -m scripts.retrain
      --bottleneck_dir=tf_files/bottlenecks --how_many_training_steps=` + steps + `
      --model_dir=tf_files/models/
      --summaries_dir=tf_files/training_summaries/"mobilenet_` + architecture + `_` + imageSize + `"
      --output_graph=tf_files/retrained_graph.pb
      --output_labels=tf_files/retrained_labels.txt
      --architecture="mobilenet_` + architecture + `_` + imageSize + `"
      --image_dir=` + imageDir]);
    }

      child2.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        if (data.toString().includes('Downloading')) {
          $('#log').append(data.toString() + '<br />');
        } else {
          $('#log').append(data.toString());
        }
        scrollLog();
        $('.testPic').show();
      });

      child2.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
        $('#log').append(data.toString());
        scrollLog();
      });

      child2.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
      });
  });
});
