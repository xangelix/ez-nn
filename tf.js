/*jshint esversion: 6*/
/*jshint multistr: true */

// Debug defines verbosity
let debug = true;

// OS dependent and command flag constants
const isWin = process.platform === 'win32',
      shellType = isWin ? 'cmd' : 'bash',
      shellFlag = isWin ? '/c' : '-c',
      shellSource = isWin ? 'activate tensorflow' :
        'source ~/tensorflow/bin/activate',
      createNNPrefix = 'cd tf/ && python -m scripts.label_image',
      stepsFlag = ' --how_many_training_steps=',
      modelDir = ' --model_dir=',
      summariesDir = '/models/ --summaries_dir=',
      bottleneckDirFlag = 'python -m scripts.retrain --bottleneck_dir=',
      tfCD = 'cd tf/ && ';

// Node.js requires and configurations
const ipcRenderer = require('electron').ipcRenderer,
      spawn = require('child_process').spawn,
      {dialog} = require('electron').remote,
      _ = require('lodash'),
      format = require('string-format'),
      request = require('request'),
      read = require('fs-readdir-recursive'),
      fs = require('fs');

format.extend(String.prototype);

// Neural network variables
let tfFilesDirectory;
let imgDir;
let imageSize = '224';
let architecture = '0.50';
let steps = '500';

// Declare global status variables
let tBstarted = false;
let oldExists = false;
let downloadingMobileNet = false;
let creatingNN = false;
let training = false;

let resultsHTMLF;
let loadingIndex = 0;

// Global child processes
let child;
let child1;
let child2;

// Updates log with parameter
function updateLog(data) {

  // Removal of text after greater than 10000 characters
  if ($('#log').text().length > 10000) {
    $('#log').html($('#log').html().substring(1000, 10000));
  }
  $('#log').append('>{}<br /><br />'.format(data));

  if (debug) {
    console.log(data);
  }

  // Automatically scrolls to the bottom
  $('#log').scrollTop($('#log')[0].scrollHeight);
}

function maxProgressBar(base) {
  $('.progressbar').progressbar({
    max: base
  });
}

function updateProgressBar(percent) {
  $('.progressbar').progressbar({
    value: percent
  });
}

// Formats confidence to percentage
function percentMe(num) {
  return (Math.round(Number(num) * 100000000) / 1000000) + '%';
}

// Options change based on the existance of old neural network data
function loadOld() {
  if (!tBstarted) { $('.startTensorBoard').fadeIn(1500); }

  updateLog('testing...\n{0}/retrained_graph.pb'.format(tfFilesDirectory));

  fs.stat('{0}/retrained_graph.pb'.format(tfFilesDirectory), (err) => {
    if (!err && tBstarted) {
      oldExists = true;
      $('.testPic').fadeIn(1500);
      $('.createNeuralNetwork').hide();
    } else {
      oldExists = false;
      $('.testPic').hide();
    }
    if (!oldExists && tBstarted && $('.photosDirectory').val().trim()) {
      $('.createNeuralNetwork').fadeIn(1500);
      $('.imgResults').html('');
    }
  });
}

// jQuery on DOM load
$(() => {

  loadOld();

  updateProgressBar(loadingIndex);
  maxProgressBar(100);

  // Test if TensorBoard is already running
  request('http://localhost:6006/', (err, res, body) => {

    // Hides buttons if TensorBoard is not running
    if (!body) {
      $('.stopTensorBoard').hide();
      $('.testPic').hide();
      $('.createNeuralNetwork').hide();
    }

    // Fade-in to avoid user seeing options before DOM load
    $('body').fadeIn(2000);
  });

  // Hides options that can't be used yet
  $('.loading').hide();
  $('.options').hide();
  $('#log').hide();
  $('.progressbar').hide();
  $('#progressbar').hide();
  $('.startTensorBoard').hide();

  // Log slide toggle on click
  $('#about').click(() => {
    $('#log').slideToggle();
  });

  // Start TensorBoard button on click
  $('#startTensorBoard').click(() => {

    if (!tfFilesDirectory) {
      updateLog('need more parameters');
      dialog.showErrorBox('Invalid Parameters!',
        'Please make sure all settings fields are filled!');
    } else {
      // Update running status boolean
      tBstarted = true;

      // Available options updated
      updateLog('atme: ' + tfFilesDirectory);
      if ('{0}/training_summaries'.format(tfFilesDirectory)) {
        $('.startTensorBoard').hide();
        $('.loading').fadeIn(400);
        child = spawn(
          shellType, [shellFlag,
            '{0} && tensorboard --logdir {1}/training_summaries &'.format(
              shellSource, tfFilesDirectory)]);

          updateLog('me again: ' +
          '{0} && tensorboard --logdir {1}/training_summaries &'.format(
            shellSource, tfFilesDirectory));
          child.stdout.on('data', function (data) {
            updateLog('stdout: ' + data.toString());
            updateLog(data.toString());
          });

          child.stderr.on('data', function (data) {
            updateLog('stderr: ' + data.toString());
            if (data.includes(`(Press CTRL+C to quit)`)) {
              loadOld();
              $('.loading').hide();
              if (!oldExists) {
                $('.createNeuralNetwork').fadeIn(1500);
                $('.imgResults').html('');
              }
            }
            updateLog(data.toString());
            $('.stopTensorBoard').fadeIn(1500);
          });

          child.on('exit', function (code) {
            updateLog('child process exited with code ');
            $('.loading').hide();
            tBstarted = false;
            $('.startTensorBoard').fadeIn(1500);
          });
      } else {
          updateLog('need more params');
      }
    }
  });

  $('.photosDirectory').change(() => {
    imgDir = $('.photosDirectory').val();
    if (!oldExists && tBstarted) {
      $('.createNeuralNetwork').fadeIn(1500);
      $('.imgResults').html('');
    }
  });

  $('.tfFilesDirectory').change(() => {
    tfFilesDirectory = $('.tfFilesDirectory').val();
    loadOld();
  });

  $('.steps').change(() => {
    steps = $('.steps').val();
  });

  $('#settings').click(() => {
    $('.options').slideToggle(70);
  });

  $('.browse').click(() => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (data) => {
      if (data) {
        updateLog(data[0]);
        $('.label1').addClass('active');
        $('.photosDirectory').val(data[0]);
        imgDir = data;
      }
    });
  });

  $('.browsetf').click(() => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (data) => {
      if (data) {
        updateLog(data[0]);
        $('.label2').addClass('active');
        $('.tfFilesDirectory').val(data[0]);
        tfFilesDirectory = data;
        loadOld();
      }
    });
  });

  $('#stopTensorBoard').click(() => {
    request('http://localhost:6006/', (err, res, body) => {
    if (body && !tBstarted) {
      updateLog('WARN: TensorBoard cannot be closed!');
    } else if (body && tBstarted) {
      $('.stopTensorBoard').hide();
      $('.createNeuralNetwork').hide();
      child.kill('SIGINT');
      updateLog('attempt');
    } else {
      $('.stopTensorBoard').hide();
      $('.createNeuralNetwork').hide();
      $('.startTensorBoard').fadeIn(1500);
    }
    });
  });

  $('#testPic').click(() => {

    // Opens browse dialog for jpg images only
    dialog.showOpenDialog({ filters: [ { name: 'JPG Images',
      extensions: ['jpg'] } ] }, (data1) => {

        child1 = spawn(shellType, [shellFlag,
          ('{0}python -m scripts.label_image --graph={1}/retrained_graph.pb \
          --labels={1}/retrained_labels.txt --image={2}').format(tfCD,
            tfFilesDirectory, data1)]);
          child1.stdout.on('data', function (data) {
            updateLog('stdout: ' + data.toString());
            updateLog(data.toString());
            if (data.includes(`Evaluation time (1-image):`)) {
              let results = data.toString().substring(data.indexOf('s') + 1,
                data.length).trim().split('\n');
              results = results.map((val) => {
                return val.split(' ');
              });
              _.chunk(results, 2);

              updateLog(results);
              updateLog(results.length);

              let categories = results.length;

              if (categories === 1) {
                resultsHTMLF = resultsHTML + cat1 + resultsSuffixHTML;

                updateLog(resultsHTMLF);

                $('.imgResults').html(resultsHTMLF.format(data1, results[0][0],
                  percentMe(results[0][1])));
              } else if (categories === 2) {
                  resultsHTMLF = resultsHTML + cat1 + cat2 + resultsSuffixHTML;

                  updateLog(resultsHTMLF);
                  $('.imgResults').html(resultsHTMLF.format(data1, results[0][0],
                    percentMe(results[0][1]), results[1][0],
                    percentMe(results[1][1])));
              } else if (categories === 3) {
                  resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 +
                    resultsSuffixHTML;
                  updateLog(resultsHTMLF);
                  $('.imgResults').html(resultsHTMLF.format(data1, results[0][0],
                    percentMe(results[0][1]), results[1][0],
                    percentMe(results[1][1]), results[2][0],
                    percentMe(results[2][1])));
              } else if (categories === 4) {
                  resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 + cat4 +
                    resultsSuffixHTML;
                  updateLog(resultsHTMLF);
                  $('.imgResults').html(resultsHTMLF.format(data1, results[0][0],
                    percentMe(results[0][1]), results[1][0],
                    percentMe(results[1][1]), results[2][0],
                    percentMe(results[2][1]), results[3][0],
                    percentMe(results[3][1])));
              } else if (categories === 5 || categories > 5) {
                  resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 + cat4 + cat5 +
                    resultsSuffixHTML;
                  updateLog(resultsHTMLF);
                  $('.imgResults').html(resultsHTMLF.format(data1, results[0][0],
                    percentMe(results[0][1]), results[1][0],
                    percentMe(results[1][1]), results[2][0],
                    percentMe(results[2][1]), results[3][0],
                    percentMe(results[3][1]), results[4][0],
                    percentMe(results[4][1])));
              } else {
                  updateLog('invalid range of categories');
              }
            }
          });

          child1.stderr.on('data', function (data) {
            updateLog('stderr: ' + data.toString());
            updateLog(data.toString());
          });

          child1.on('exit', function (code) {
            updateLog('child process exited with code ' + code);
            updateLog(code.toString());
          });
      });

  });

  $('#createNeuralNetwork').click(() => {
    if (imgDir && tfFilesDirectory && !(imgDir[0].trim() === '') &&
      !(tfFilesDirectory[0].trim() === '') ) {
        $('.createNeuralNetwork').hide();
        $('.stopTensorBoard').hide();
        $('.loading').fadeIn(1500);

        steps = $('.steps').val();

        var totalImages = read(imgDir[0]);

        updateLog('dir: ' + imgDir[0]);
        updateLog('amount of files: ' + totalImages.length);

        //.format(tfFilesDirectory)
        child2 = spawn(shellType, [shellFlag,
          '{0}{1}{2}/bottlenecks{3}{4}{5}{2}{6}{2}/training_summaries/mobilenet_{7}_{8} \
          --output_graph={2}/retrained_graph.pb \
          --output_labels={2}/retrained_labels.txt \
          --architecture=mobilenet_{7}_{8} --image_dir={9}'.format(tfCD,
            bottleneckDirFlag, tfFilesDirectory, stepsFlag, steps, modelDir,
            summariesDir, architecture, imageSize, imgDir)]);

        child2.stdout.on('data', function (data) {
          updateLog('stdout: ' + data.toString());
          if (data.includes(`variables to const ops.`)) {
            training = false;
            loadingIndex = 0;
            updateProgressBar(loadingIndex);
            $('.testPic').fadeIn(1500);
            $('.stopTensorBoard').fadeIn(1500);
          } else if (data.toString().includes('Downloading mobilenet')) {
            if (!downloadingMobileNet) {
              maxProgressBar(100);
              downloadingMobileNet = true;
              $('.progressbar').fadeIn(200);
                $('#progressbar').fadeIn(200);
              $('.actionDescription').html(loadDownloading);
            }
            let loadingStat = data.toString().substring(data.indexOf('%') - 4,
              data.indexOf('%')).trim();
            updateLog(loadingStat);
            updateProgressBar(Number(loadingStat));
            $('#progressbar').html('{0}/{1}'.format(
              Number(loadingStat), 100));
              updateLog(data.toString());
          }
        });

        child2.stderr.on('data', function (data) {
          updateLog('stderr: ' + data.toString());
          if (data.toString().includes('Creating bottleneck')) {
            if (!creatingNN) {
              maxProgressBar(totalImages.length);
              creatingNN = true;
              $('.actionDescription').html(loadCreateNeuralNetwork);
            }
            loadingIndex++;
            updateProgressBar(loadingIndex);
            $('#progressbar').html('{0}/{1}'.format(
              Number(loadingIndex), totalImages.length));
          } else if (data.toString().includes('Successfully downloaded')) {
            downloadingMobileNet = false;
            loadingIndex = 0;
            updateProgressBar(loadingIndex);
          } else if (data.toString().includes('Step ')) {
            if (!training) {
              maxProgressBar(steps);
              training = true;
              $('.actionDescription').html(loadTraining);
            }
            let stepStat = data.toString().substring(
              data.lastIndexOf(':') - steps.length,
              data.lastIndexOf(':')).trim();
            updateLog(stepStat);
            updateProgressBar(Number(stepStat.replace(/\D/g, '')));
            $('#progressbar').html('{0}/{1}'.format(
              Number(stepStat.replace(/\D/g, '')), steps));
          } else if (data.toString().includes('tensorflow.python.ops.nn_op')) {
            creatingNN = false;
            loadingIndex = 0;
            updateProgressBar(loadingIndex);
          }
          updateLog(data.toString());
        });

        child2.on('exit', function (code) {
          updateLog('child process exited with code ' + code.toString());
          updateLog('child process exited with code ' + code.toString());
          $('.loading').hide();
          $('.progressbar').hide();
          $('#progressbar').hide();
          $('.actionDescription').html(``);
        });
      } else {
        updateLog('need more params');
        dialog.showErrorBox('Invalid Parameters!',
          'Please make sure all settings fields are filled!');
      }

  });
});


// Action description html
const loadDownloading = `
<br />
<h5>Downloading required assets...</h5>
`;
const loadCreateNeuralNetwork = `
<br />
<h5>Creating neural network...</h5>
`;
const loadTraining = `
<br />
<h5>Training neural network...</h5>
`;

// Results HTML
const resultsHTML = `
<br /><br /><br /><br /><br /><br /><br />
  <section class="container">
    <div class="left-half">
      <article>
        <h1>Test Picture</h1>
        <img width="200" height="200" src="{0}" />
      </article>
    </div>
    <div class="right-half">
      <article><br /><br />
        <h1 class="resultsHead">Results</h1>
        <table class="resultsTable">
          <tr>
            <td>
              Guess:
            </td>
            <td>
              Confidence:
            </td>
          </tr>`;
const cat1 = `
          <tr>
            <td>
              {1}
            </td>
            <td>
              {2}
            </td>
          </tr>`;
const cat2 = `
          <tr>
            <td>
              {3}
            </td>
            <td>
              {4}
            </td>
          </tr>`;
const cat3 = `
          <tr>
            <td>
              {5}
            </td>
            <td>
              {6}
            </td>
          </tr>`;
const cat4 = `
          <tr>
            <td>
              {7}
            </td>
            <td>
              {8}
            </td>
          </tr>`;
const cat5 = `
          <tr>
            <td>
              {9}
            </td>
            <td>
              {10}
            </td>
          </tr>`;
const resultsSuffixHTML = `
      </table>
    </article>
  </div>
  </section>
  <br /><br /><br /><br /><br /><br /><br /><br />`;
