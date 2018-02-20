# ez-nn (Easy Neural Networks)

An easy graphical user interface for creating image based convolutional neural
networks using the TensorFlow library.

[Current Release](https://github.com/Matrix-Guy/ez-nn/releases)

## For Feature Suggestions and Bug Reports

Please use the [issues tracker on this GitHub
repository](https://github.com/Matrix-Guy/ez-nn/issues)!

## Current Features
* Create image neural networks and test them using this easy to use GUI.
* Actual applicability of this application is likely limited, this is just
meant for a fun demonstration of TensorFlow.

## Upcoming Features (higher importance closer to the top)
* Lots of commenting and documentation
* Many more neural network options
* Full users guide and documentation
* More log data
* Code shortening and increased efficiency
* Cleanup confusing mix of classes and ids
* Possible stopping of TensorBoard inside the application

## Known Issues
* TensorBoard does not interact properly on windows
* Spaces in folder names or subfolder names cause problems with training and
testing pictures

## Prerequisites

* [Python ^3.6](https://www.python.org/) - or use
[Anaconda](https://www.anaconda.com) if on windows
* [TensorFlow](https://www.tensorflow.org/) -
**TensorFlow must be installed in a separate environment called
```tensorflow```**
* [Node.js/npm](https://nodejs.org/en/) - for yarn and installation of
dependencies
* [yarn](https://yarnpkg.com/en/) for installation
* [npm](https://nodejs.org/en/) for installation

## Installing and Deployment

1. Clone the repository.
2. Install [Python ^3.6](https://www.python.org/) or use
[Anaconda](https://www.anaconda.com) if on windows, make sure you install to
PATH environment variable.
3. Install [TensorFlow](https://www.tensorflow.org/install).
**TensorFlow must be installed in a separate environment called
```tensorflow```. Also make sure to follow all the directions very carefully
and install in the way Google recommends.**
4. Install [node.js/npm](https://nodejs.org/en/)
5. Install [yarn](https://yarnpkg.com/en/)
3. In the directory of the repository execute the command: ```yarn install```.
4. Then ```yarn start```.
5. Done!
6. If errors occur try installing under root and switching back to user before
start. It is currently unknown why this is sometimes necessary.

Most editing you will want to do if any will take place in [tf.js](tf.js).

Happy forking!

## Built With

* [Python ^3.6](https://www.python.org)
* [JavaScript ES6](https://www.javascript.com/)
* [Node.js 9.5.0](https://www.npmjs.com/)
* [Materialize 1.0 alpha](http://materializecss.com/)
* [Custom jQuery-UI 1.12.1](http://jqueryui.com/)

### Pip Packages
* [TensorFlow 1.5.1](https://www.tensorflow.org/)

### Node Modules

* [electron ^1.8.2](https://www.npmjs.com/package/electron)
* [jquery ^3.3.1](https://www.npmjs.com/package/jquery)
* [lodash ^4.17.5](https://www.npmjs.com/package/lodash)
* [remote ^0.2.6](https://www.npmjs.com/package/remote)
* [request ^2.83.0](https://www.npmjs.com/package/request)
* [string-format ^0.5.0](https://www.npmjs.com/package/string-format)
* [fs-readdir-recursive ^1.1.0
](https://www.npmjs.com/package/fs-readdir-recursive)

## Contributing

Submit an issue tracker or a pull request and someone will get back to you.

## Authors

* **Cody Neiman** - *AKA* - [Matrix-Guy](https://github.com/Matrix-Guy)

Any future collaborators will be added here.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE
(Version 3, 29 June 2007) - see the [LICENSE](LICENSE) file for details.

**DISCLAIMER:** This license only applies to material not linked above!
To find the license of each tool/language/api/library ez-nn is created with,
please view the links provided for each one as listed above.

## Acknowledgments

* Thanks to Google for the awesome TensorFlow API library :)
