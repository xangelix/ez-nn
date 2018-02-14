/*jshint esversion: 6*/

// Debug defines verbosity
let debug = true;

// OS dependent and command flag constants
const isWin = process.platform === "win32",
      shellType = isWin ? 'cmd' : 'bash',
      shellFlag = isWin ? '/c' : '-c',
      shellSource = isWin ? 'activate tensorflow' : 'source ~/tensorflow/bin/activate',
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
      fs = require('fs');

format.extend(String.prototype);

let tfFilesDirectory;
let tBLogDir = '{0}/training_summaries'.format(tfFilesDirectory);
let fRetrainedGraphPB = '{0}/retrained_graph.pb'.format(tfFilesDirectory);
let retrainedGraphPB = '{0}/retrained_graph.pb'.format(tfFilesDirectory);
let imgDir;
let tBstarted = false;
let imageSize = '224';
let architecture = '0.50';
let steps = '500';
let resultsHTMLF;

let rmType = isWin ? 'dir"' : 'rm -rf {0}/*'.format(tfFilesDirectory);

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


// Formats confidence to percentage
function percentMe(num) {
  return (Math.round(Number(num) * 10000) / 100) + '%';
}

// jQuery on DOM load
$(() => {

  request('http://localhost:6006/', (err, res, body) => {
    if (!body) {
      $('.stopTensorBoard').hide();
      $('.testPic').hide();
      $('.createNeuralNetwork').hide();
    }

    // Fade-in to avoid user seeing options before DOM load
    $("body").fadeIn(2000);
  });

  // Hides options that can't be used yet
  fs.stat(retrainedGraphPB, (err) => {
    if (err) {
      $('.testPic').hide();
      //$('.cleanup').hide();
    }
  });

  $('.loading').hide();
  $('.options').hide();
  $('#log').hide();
  $('.cleanup').hide();

  // About button on click
  $('#about').click(() => {

    $('#log').slideToggle();

    // Logs all package info
    /*
    if (debug) {
      require('child_process').exec('npm ls --json', function(err, stdout, stderr) {
        if (err) return console.log(err);
        updateLog(JSON.stringify(stdout));
      });
    }
    */
  });


  // Start TensorBoard button on click
  $('#startTensorBoard').click(() => {

    tBstarted = true;

    // Available options updated
    if (tBLogDir) {
      $('.startTensorBoard').hide();
      $('.loading').fadeIn(400);
      child = spawn(
        shellType, [shellFlag, '{0}{1} && tensorboard --logdir {2}'.format(
          tfCD, shellSource, tBLogDir)]);

        child.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
          updateLog(data.toString());
        });

        child.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
          if (data.includes(`(Press CTRL+C to quit)`)) {
            $('.loading').hide();
            if ($('.cleanup').is(":visible")) {
              $('.testPic').fadeIn(1500);
            } else {
              $('.createNeuralNetwork').fadeIn(1500);
            }
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
    imgDir = '"' + $('.photosDirectory').val() + '"';
  });

  $('.tfFilesDirectory').change(() => {
    tfFilesDirectory = '"' + $('.tfFilesDirectory').val() + '"';
    retrainedGraphPB = '{0}/retrained_graph.pb'.format(tfFilesDirectory);
  });

  $('#settings').click(() => {
    $('.options').slideToggle(70);
  });

  $('.browse').click(() => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (data) => {
      if (data) {
        console.log(data[0]);
        $('.label1').addClass('active');
        $('.photosDirectory').val(data[0]);
        imgDir = data;
      }
    });
  });

  $('.browsetf').click(() => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (data) => {
      if (data) {
        console.log(data[0]);
        $('.label2').addClass('active');
        $('.tfFilesDirectory').val(data[0]);
        tfFilesDirectory = data;
        retrainedGraphPB = '{0}/retrained_graph.pb'.format(tfFilesDirectory);
      }
    });
  });

  $('#stopTensorBoard').click(() => {
    request('http://localhost:6006/', (err, res, body) => {
    if (body && !tBstarted) {
      console.log('WARN: TensorBoard cannot be closed!');
    } else if (body && tBstarted) {
      $('.stopTensorBoard').hide();
      $('.createNeuralNetwork').hide();
      child.kill('SIGINT');
      console.log('attempt');
    } else {
      $('.stopTensorBoard').hide();
      $('.createNeuralNetwork').hide();
      $('.startTensorBoard').fadeIn(1500);
    }
    });
  });

  $('#cleanup').click(() => {
    $('.testPic').hide();
    //$('.loading').fadeIn(400);
    $('.imgResults').html('');
    child3 = spawn(shellType, [shellFlag, rmType]);

    child3.stdout.on('data', (data) => {
      console.log('stdout: ' + data.toString());
      //updateLog(data.toString());
    });

    child3.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString());
      //updateLog(data.toString());
    });

    child3.on('exit', (code) => {
      console.log('child process exited with code ' + code.toString());
      //updateLog('child process exited with code ' + code.toString());
      $('.loading').hide();
      //$('.cleanup').hide();
      if ($('.stopTensorBoard').is(":visible")) {
        $('.createNeuralNetwork').fadeIn(1500);
      }
    });

  });

  $('#testPic').click(() => {

    dialog.showOpenDialog({ filters: [ { name: 'JPG Images', extensions: ['jpg'] } ] }, (data1) => {

      child1 = spawn(shellType, [shellFlag, tfCD + `python -m scripts.label_image --graph=` + retrainedGraphPB + ` --image=` + data1]);
        child1.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
          updateLog(data.toString());
          if (data.includes(`Evaluation time (1-image):`)) {
            let results = data.toString().substring(data.indexOf("s") + 1, data.length).trim().split('\n');
            results = results.map((val) => {
              return val.split(' ');
            });
            _.chunk(results, 2);
            /*
            results.sort((a, b) => {
              if (a[1] === b[1]) {
                return 0;
              }
              else {
                return (a[1] < b[1]) ? -1 : 1;
              }
            });
            */
            console.log(results);
            console.log(results.length);
            let categories = results.length;

            if (categories === 1) {
              resultsHTMLF = resultsHTML + cat1 + resultsSuffixHTML;
              console.log(resultsHTMLF);
              $('.imgResults').html(resultsHTMLF.format(data1, results[0][0], percentMe(results[0][1])));
            } else if (categories === 2) {
              resultsHTMLF = resultsHTML + cat1 + cat2 + resultsSuffixHTML;
              console.log(resultsHTMLF);
              $('.imgResults').html(resultsHTMLF.format(data1, results[0][0], percentMe(results[0][1]), results[1][0], percentMe(results[1][1])));
            } else if (categories === 3) {
              resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 + resultsSuffixHTML;
              console.log(resultsHTMLF);
              $('.imgResults').html(resultsHTMLF.format(data1, results[0][0], percentMe(results[0][1]), results[1][0], percentMe(results[1][1]), results[2][0], percentMe(results[2][1])));
            } else if (categories === 4) {
              resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 + cat4 + resultsSuffixHTML;
              console.log(resultsHTMLF);
              $('.imgResults').html(resultsHTMLF.format(data1, results[0][0], percentMe(results[0][1]), results[1][0], percentMe(results[1][1]), results[2][0], percentMe(results[2][1]), results[3][0], percentMe(results[3][1])));
            } else if (categories === 5 || categories > 5) {
              resultsHTMLF = resultsHTML + cat1 + cat2 + cat3 + cat4 + cat5 + resultsSuffixHTML;
              console.log(resultsHTMLF);
              $('.imgResults').html(resultsHTMLF.format(data1, results[0][0], percentMe(results[0][1]), results[1][0], percentMe(results[1][1]), results[2][0], percentMe(results[2][1]), results[3][0], percentMe(results[3][1]), results[4][0], percentMe(results[4][1])));
            } else {
              console.log('invalid range of categories');
            }
          }
        });

        child1.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
          updateLog(data.toString());
        });

        child1.on('exit', function (code) {
          console.log('child process exited with code ' + code);
          updateLog(code.toString());
        });
    });

  });

  $('#createNeuralNetwork').click(() => {
    if (imgDir && tfFilesDirectory && !(imgDir[0].trim() === '') && !(tfFilesDirectory[0].trim() === '') ) {
      $('.createNeuralNetwork').hide();
      $('.stopTensorBoard').hide();
      $('.loading').fadeIn(1500);
      //.format(tfFilesDirectory)
      child2 = spawn(shellType, [shellFlag, tfCD + bottleneckDirFlag + tfFilesDirectory + '/bottlenecks' + stepsFlag + steps + modelDir + tfFilesDirectory + summariesDir + tfFilesDirectory + '/training_summaries/mobilenet_' + architecture + '_' + imageSize + ' --output_graph=' + tfFilesDirectory + '/retrained_graph.pb --output_labels='+ tfFilesDirectory + '/retrained_labels.txt --architecture=mobilenet_' + architecture + '_' + imageSize + ' --image_dir=' + imgDir]);

      child2.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        if (data.includes(`variables to const ops.`)) {
          $('.testPic').fadeIn(1500);
        }
        //updateLog(data.toString());
      });

      child2.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
        //updateLog(data.toString());
      });

      child2.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
        //updateLog('child process exited with code ' + code.toString());
        $('.loading').hide();
        $('.cleanup').fadeIn(1500);
      });
    } else {
      console.log('need more params');
      dialog.showErrorBox('Invalid Parameters!', 'Please make sure all settings fields are filled!');
    }

  });

  let resultsHTML = `
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
});
