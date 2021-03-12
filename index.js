const express = require("express");
const path = require("path");
const app = new express();
const cheerio = require("cheerio");
const got = require("got");

app.use(express.static(path.join(__dirname, './public'),  {
    index: false, 
    immutable: true, 
    cacheControl: true,
    maxAge: "30d"}
));
app.use(express.urlencoded({
    extended: true
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

var name, desig, uni, dept, interests = [], most_cited, citations;


var getData = async(u) => {
    try {
        // const res = await got('https://scholar.google.com/citations?user=26EpKSkAAAAJ&hl=fr'); //Dr. Younis Javed
        // const res = await got('https://scholar.google.com/citations?user=4_i4ni4AAAAJ&hl=fr'); //Mr. M. Attique Khan
        const res = await got(u);        
        const $ = cheerio.load(res.body);
        var i = 0;
        interests = [];
        
        while($('div')[i] != undefined) {
            //name 
            if($('div')[i]["attribs"].id == 'gsc_prf_in') {
                name = $('div')[i]["children"][0].data;
            }
            //dept
            if($('div')[i]["attribs"].class == 'gsc_prf_il' && $('div')[i]["attribs"]['id'] == undefined) {
                if($('div')[i]["children"][0]["data"] != undefined) {
                    let s = $('div')[i]["children"][0]["data"];
                    desig = s.split(", ")[0];
                    dept = s.split(", ")[1];
                }
                else {
                    desig = "Not mentioned.";
                    dept = "Not mentioned.";
                }
            }
            i++;
        }
        
        i = 0;

        while($('a')[i] != undefined) {
            //uni
            if($('a')[i]["attribs"].class == 'gsc_prf_ila') {
                uni = $('a')[i]["children"][0].data;
            }
            //interests
            if($('a')[i]["attribs"].class == 'gsc_prf_inta gs_ibl') {
                interests.push($('a')[i]["children"][0].data);
            }
            i++;
        }

        //citations
        citations = $('td')[1]['children'][0].data;

        //most cited
        //gsc_a_tr
        i = 0;
        while($('tr')[i] != undefined) {
            if($('tr')[i]["attribs"].class == 'gsc_a_tr') {
                let child = $('tr')[i]["children"];
                if(child[0] != undefined) {
                    most_cited = child[0]["children"][0]["children"][0]["data"];
                    break;
                }
            }
            i++;
        }
    }
    catch(err) {
        console.log(err);
    }
}

app.post("/get_scholar/", async(req, res) => {
    try{
        await getData(req.body.url);
    }
    catch(err) {
        console.log(err);
    }
    const d = {
        name: name,
        desig: desig,
        uni: uni,
        dept: dept,
        interests: interests,
        most_cited: most_cited,
        citations: citations
    }
    res.render("index", d);
});

app.get('/', (req, res) => {
    const d = {
        name: name,
        desig: desig,
        uni: uni,
        dept: dept,
        interests: interests,
        most_cited: most_cited,
        citations: citations
    }
    res.render('index', d);
});

app.listen(8080, () => {
    console.log("Server running..");
});