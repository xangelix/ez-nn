/*jshint esversion: 6*/

// Debug defines verbosity
let debug = true;

// OS dependent and command flag constants
const isWin = process.platform === "win32",
      shellType = isWin ? 'cmd' : 'bash',
      shellFlag = isWin ? '/c' : '-c',
      shellSource = isWin ? 'activate tensorflow' : 'source ~/tensorflow/bin/activate',
      createNNPrefix = 'cd tf/ && python -m scripts.label_image',
      tfChangeDir = 'cd tf/ && ',
      startTBLogDirFlag = ' && tensorboard --logdir ';

// Node.js requires and configurations
const ipcRenderer = require('electron').ipcRenderer,
      spawn = require('child_process').spawn,
      {dialog} = require('electron').remote,
      format = require('string-format');

format.extend(String.prototype);

let tBLogDir = 'tf_files/training_summaries';
let imgDir;

// Global child processes
let child;
let child1;
let child2;

// Updates log with parameter and scrolls to the bottom
function updateLog(data) {
  document.getElementById("log").innerHTML += '>{}<br /><br />'.format(data);
  console.log(data);
  $('#log').scrollTop($('#log')[0].scrollHeight);
}


// jQuery on DOM load
$(() => {

  // Hides options that can't be used yet
  $('.createNeuralNetwork').hide();
  $('.loading').hide();
  $('.testPic').hide();
  $('.stopTensorBoard').hide();
  $('.options').hide();

  // Fade-in to avoid user seeing options before DOM load
  $("body").fadeIn(2000);


  // About button on click
  $('#about').click(() => {

    // Logs all package info
    if (debug) {
      require('child_process').exec('npm ls --json', function(err, stdout, stderr) {
        if (err) return console.log(err);
        updateLog(JSON.stringify(stdout));
      });
    }
  });

  // Start TensorBoard button on click
  $('#startTensorBoard').click(() => {

    // Available options updated
    if (tBLogDir) {
      $('.startTensorBoard').hide();
      $('.loading').fadeIn(400);
      child = spawn(shellType, [shellFlag, tfChangeDir + shellSource + startTBLogDirFlag + tBLogDir]);

      ipcRenderer.on('closing-message', function(event, arg) {
        console.log(arg);
        child.kill('SIGINT');
        event.sender.send('closing-reply', 'pong');
      });

      $('#stopTensorBoard').click(() => {
        $('.stopTensorBoard').hide();
        $('.createNeuralNetwork').hide();
        child.kill('SIGINT');
        console.log('attempt');
      });

        child.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
          updateLog(data.toString());
        });

        child.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
          if (data.includes(`(Press CTRL+C to quit)`)) {
            $('.loading').hide();
            $('.createNeuralNetwork').fadeIn(1500);
          }
          updateLog(data.toString());
          $('.stopTensorBoard').fadeIn(1500);
        });

        child.on('exit', function (code) {
          console.log('child process exited with code ');
          $('.loading').hide();
          $('.startTensorBoard').fadeIn(1500);
        });
    } else {
      console.log('need more params');
    }
  });

  $('.photosDirectory').change(() => {
    imgDir = $('.photosDirectory').val();
  });

  $('#settings').click(() => {
    $('.options').slideToggle(0);
  });

  $('.browse').click(() => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (data) => {
      if (data) {
        console.log(data[0]);
        $('.labeling').addClass('active');
        $('.photosDirectory').val(data[0]);
        imgDir = data;
      }
    });
  });

  $('#testPic').click(() => {

    dialog.showOpenDialog({ filters: [ { name: 'JPG Images', extensions: ['jpg'] } ] }, (data) => {
      if (isWin) {
        console.log(`cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=` + data);
        child1 = spawn(shellType, [shellFlag, `cd tf/ && python -m scripts.label_image --graph=tf_files/retrained_graph.pb --image=` + data]);
      } else {
        child1 = spawn(shellType, [shellFlag, `cd tf/ && python -m scripts.label_image
        --graph=tf_files/retrained_graph.pb
        --image=${data}`]);
      }

        child1.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
          updateLog(data.toString());
        });

        child1.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
          updateLog(data.toString());
        });

        child1.on('exit', function (code) {
          console.log('child process exited with code ' + code.toString());
          updateLog(data.toString());
        });
    });

  });

  $('#createNeuralNetwork').click(() => {
    if (imgDir) {
      $('#createNeuralNetwork').hide();
      $('.stopTensorBoard').hide();
      $('.loading').show();
      var imageSize = '224';
      var architecture = '0.50';
      var steps = '500';

      child2 = spawn(shellType, [shellFlag, 'cd tf/ && python -m scripts.retrain --bottleneck_dir=tf_files/bottlenecks --how_many_training_steps=' + steps + ' --model_dir=tf_files/models/ --summaries_dir=tf_files/training_summaries/mobilenet_' + architecture + '_' + imageSize + ' --output_graph=tf_files/retrained_graph.pb --output_labels=tf_files/retrained_labels.txt --architecture=mobilenet_' + architecture + '_' + imageSize + ' --image_dir=' + imgDir]);


      child2.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        //updateLog(data.toString());
        $('.testPic').fadeIn(1500);
      });

      child2.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
        //updateLog(data.toString());
      });

      child2.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
        //updateLog('child process exited with code ' + code.toString());
      });
    } else {
      console.log('need more params');
    }

  });
});
