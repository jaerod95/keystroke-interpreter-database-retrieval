// Connection URL

module.exports = function () {
    const Mongo = require('mongodb');
    const assert = require('assert');
    const fs = require('fs');
    const path = require('path');

    var url = 'mongodb://jrod95:jrod95@ds137690-a0.mlab.com:37690,ds137690-a1.mlab.com:37690/keystroke-data?replicaSet=rs-ds137690'

    var finished = [];
    var incrementCount = 10;

    // Use connect method to connect to the server
    Mongo.MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        getCollectionData(db.collection('pdf'), (documents) => {
            var pdfs = [];
            for (doc in documents) {

                pdfs.push({
                    "_id": documents[doc]._id,
                    "pdf": documents[doc].pdf
                });

            }
            var pdfSaver = new PDF_Saver();
            pdfSaver.savePDFs(pdfs);
        });

        getCollectionData(db.collection('users'), (documents) => {
            var users = [];
            for (doc in documents) {
                users.push(documents[doc]);
            }
            var userSaver = new User_Saver();
            userSaver.saveUsers(users);
        });

        getCollectionData(db.collection('gathered-data'), (documents) => {
            var dataSaver = new Data_Saver();
            dataSaver.saveData(documents);
        });


        closeDatabase(db);
    });

    function closeDatabase(db) {
        if (finished.length == 3) {
            console.log('database closed!!');
            db.close();
            return;
        } else {
            console.log('database still working...')
            setTimeout(closeDatabase, 1000, db);
            return;
        }
    }

    function getCollectionData(collection, callback) {
        collection.count(function (err, numOfDocs) {
            collection.find({}).limit(incrementCount).toArray(function (err, docs) {
                assert.equal(err, null);
                callback(docs);
                if (incrementCount < numOfDocs) {
                    getCollectionDataContinue(collection, callback, incrementCount, numOfDocs);
                } else {
                    finished.push('1');
                }
            });
        });
    }

    function getCollectionDataContinue(collection, callback, start, numOfDocs) {
        collection.find({}).skip(parseInt(start)).limit(incrementCount).toArray(function (err, docs) {
            assert.equal(err, null);
            callback(docs);
            if ((start + incrementCount) < numOfDocs)
                getCollectionDataContinue(collection, callback, start + incrementCount, numOfDocs);
            else
                finished.push('1');
        });
    }


    function Data_Saver() {
        this.saveData = (documents) => {
            if (!fs.existsSync('./raw')) {
                fs.mkdirSync('./raw');
            }
            for (doc in documents) {
                fs.writeFile(path.join(__dirname, 'raw', documents[doc]._id + ".json"), JSON.stringify(documents[doc]), function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The data-file was saved!");
                });
            }
        }
    }

    function PDF_Saver() {
        this.savePDFs = (pdf_Array) => {
            if (!fs.existsSync('./consent_forms')) {
                fs.mkdirSync('./consent_forms');
            }
            pdf_Array.forEach((val, ind, arr) => {

                fs.writeFile(path.join(__dirname, 'consent_forms', val._id + ".pdf"), val.pdf, {
                    encoding: 'utf8'
                }, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The pdf-file was saved!");
                });

            });
        }
    }

    function User_Saver() {
        this.saveUsers = (users_Array) => {
            if (!fs.existsSync('./users')) {
                fs.mkdirSync('./users');
            }
            users_Array.forEach((val, ind, arr) => {

                fs.writeFile(path.join(__dirname, 'users', val._id + ".json"), JSON.stringify(val), 'binary', function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The user-file was saved!");
                });

            });
        }
    }

}