// Connection URL

module.exports = function () {
    const Mongo = require('mongodb');
    const assert = require('assert');
    const fs = require('fs');
    const path = require('path');

    var url = 'mongodb://jrod95:jrod95@ds137690-a0.mlab.com:37690,ds137690-a1.mlab.com:37690/keystroke-data?replicaSet=rs-ds137690'

    var pdfDataDone = false;
    var usersDone = false;
    var keystrokeDataDone = false;

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
                pdfDataDone = true;
            });

            getCollectionData(db.collection('users'), (documents) => {
                var users = [];
                for (doc in documents) {
                    users.push(documents[doc]);
                }
                var userSaver = new User_Saver();
                userSaver.saveUsers(users);
                usersDone = true;
            });

            getCollectionData(db.collection('gathered-data'), (documents) => {
                if (!fs.existsSync('./raw')) {
                    fs.mkdirSync('./raw');
                }
                for (doc in documents) {

                    fs.writeFile(path.join(__dirname, 'raw', documents[doc]._id + ".json"), JSON.stringify(documents[doc]), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The file was saved!");
                    });
                }
                keystrokeDataDone = true;
            });

            closeDatabase(pdfDataDone, keystrokeDataDone, usersDone, db);
        });


        function closeDatabase(pdf, data, users, db) {
            if (pdf && data && users) {
                console.log('database closed!!');
                db.close();
                return;
            } else {
                console.log('database still working...')
                setTimeout(closeDatabase, 1000, pdfDataDone, keystrokeDataDone, usersDone, db);
                return;
            }
        }

        function getCollectionData(collection, callback) {
            collection.find({}).toArray(function (err, docs) {
                assert.equal(err, null);
                callback(docs);
            });
        }

    function PDF_Saver() {
        this.savePDFs = (pdf_Array) => {
            if (!fs.existsSync('./consent_forms')) {
                fs.mkdirSync('./consent_forms');
            }
            pdf_Array.forEach((val, ind, arr) => {

                fs.writeFile(path.join(__dirname, 'consent_forms', val._id + ".pdf"), val.pdf, {encoding: 'utf8'}, function (err) {
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
                    console.log("The pdf-file was saved!");
                });

            });
        }
    }

}