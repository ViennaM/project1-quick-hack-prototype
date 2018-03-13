(() => {
  const app = {
    init: function () {
      this.handleEvents()
      console.log('app')
    },
    handleEvents: function (curCategory, search) {
      global.elements.loader.style.display = 'block'
      global.elements.maindialog.style.display = 'none'
      helper.emptyElement(global.elements.list)
      api.getData(global.elements.curCategory, search)
      console.log('handleevents')
    }
  }

  const global = {
    elements: {
      loader: document.querySelector('#loader'),
      list: document.querySelector('ol'),
      maindialog: document.querySelector('dialog'),
      moreImgs: [],
      categories: [
        'Music.',
        'Art.',
        'Portrait.',
        'Theatre.',
        'Caricature.'
      ],
      curCategory: false,
      searchKey: '',
      searchCount: '',
    },
    events: function () {
      //gobal events

    }
  }

  const api = {
    getData: function (curCategory, search) {
      console.log('getdata')
      global.elements.searchCount = ''
      global.elements.searchKey = search
      const sparqlquery = `
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
      SELECT ?poster ?title ?img ?date ?description ?subject WHERE {
        ?poster dc:type "Poster."^^xsd:string .
        ?poster dc:title ?title .
        ?poster dc:description ?description .
        ?poster dc:subject ?subject .
        ${search ? `FILTER (REGEX(lcase(str(?description)), "${search}") || REGEX(lcase(str(?title)), "${search}"))` : ``}
        ${curCategory ? `?poster dc:subject "${curCategory}"^^xsd:string .` : `FILTER (REGEX(?subject, "Music.") || REGEX(?subject, "Music.")  || REGEX(?subject, "Biographica.")  || REGEX(?subject, "Portrait.")  || REGEX(?subject, "Housing.")  || REGEX(?subject, "Caricature.")  || REGEX(?subject, "Urban development.")  || REGEX(?subject, "Pop music.")  || REGEX(?subject, "Local elections.")  || REGEX(?subject, "Culture.")  || REGEX(?subject, "Underground railway.") )`}
        FILTER (!REGEX(?title, "Poster"))
        FILTER (!REGEX(?subject, "http"))
        FILTER (!REGEX(?date, "Ca"))
        ?poster foaf:depiction ?img .
        ?poster sem:hasBeginTimeStamp ?date .
      }
      ORDER BY ?date
      LIMIT 1000
    `

    if(search) {
      const countquery = `
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
SELECT count(*) as ?count WHERE {
        ?poster dc:type "Poster."^^xsd:string .
        ?poster dc:title ?title .
        ?poster dc:description ?description .
        ?poster dc:subject ?subject .
        ${search ? `FILTER (REGEX(lcase(str(?description)), "${search}") || REGEX(lcase(str(?title)), "${search}"))` : ``}
        ${curCategory ? `?poster dc:subject "${curCategory}"^^xsd:string .` : `FILTER (REGEX(?subject, "Music.") || REGEX(?subject, "Music.")  || REGEX(?subject, "Biographica.")  || REGEX(?subject, "Portrait.")  || REGEX(?subject, "Housing.")  || REGEX(?subject, "Caricature.")  || REGEX(?subject, "Urban development.")  || REGEX(?subject, "Pop music.")  || REGEX(?subject, "Local elections.")  || REGEX(?subject, "Culture.")  || REGEX(?subject, "Underground railway.") )`}
        FILTER (!REGEX(?title, "Poster"))
        FILTER (!REGEX(?subject, "http"))
        FILTER (!REGEX(?date, "Ca"))
        ?poster foaf:depiction ?img .
        ?poster sem:hasBeginTimeStamp ?date .
      }
      ORDER BY ?count
      LIMIT 1
      `
      const countencodedquery = encodeURIComponent(countquery);
      const countqueryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + countencodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
      fetch(countqueryurl)
      .then((resp) => resp.json()) // transform the data into json
        .then(function (data) {
          global.elements.searchCount = data.results.bindings[0].count.value
          if(global.elements.searchCount.length === 0) {
          } 
          
        })
    }
      const encodedquery = encodeURIComponent(sparqlquery);
      const queryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
      fetch(queryurl)
        .then((resp) => resp.json()) // transform the data into json
        .then(function (data) {
          console.log('fetch')
          let rows = data.results.bindings.map((poster) => {
            let obj = {
              img: poster.img.value,
              description: poster.description.value,
              title: poster.title.value.substring(0, poster.title.value.length - 1),
              subject: poster.subject.value,
              date: poster.date.value.substring(0, 4)
            }
            return obj
          })
          var singleData = []
          var unique = {}
          // Remove duplicates: https://vikasrao.wordpress.com/2011/06/09/removing-duplicates-from-a-javascript-object-array/
          dojo.forEach(rows, function (item) {
            if (!unique[item.img]) {
              singleData.push(item)
              unique[item.img] = item;
            }
          })
          let checkData = helper.shuffle(singleData).slice(0, 50)

          let renderData = []
          let count = 0
          
          checkData.forEach((poster) => {
            let url = poster.img
            helper.checkImg(url, function (existsImage) {
              if (existsImage === true && count < 35) {
                count++
                renderData.push(poster)
              }
            })
          })

          let update = setInterval(() => {
            if (renderData.length === 35 || (search && renderData.length === Number(global.elements.searchCount))) {
              clearInterval(update)
              console.log('update')
              template.renderPosters(renderData)
            }
          }, 100)
        })
        global.elements.searchKey = ''
        global.elements.searchCount = ''
    },
    moreImg: function (subject, posterData, index) {
      const sparqlquery = `
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
        SELECT ?poster ?title ?img ?date ?description ?subject WHERE {
          ?poster dc:type "Poster."^^xsd:string .
          ?poster dc:title ?title .
          ?poster dc:description ?description .
          ?poster dc:subject ?subject .?poster dc:subject "${subject}"^^xsd:string 
          FILTER (!REGEX(?title, "Poster"))
          FILTER (!REGEX(?subject, "http"))
          FILTER (!REGEX(?date, "Ca"))
          ?poster foaf:depiction ?img .
          ?poster sem:hasBeginTimeStamp ?date .
        }
        ORDER BY ?date
        LIMIT 1000
      `
      const encodedquery = encodeURIComponent(sparqlquery);
      const queryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
      fetch(queryurl)
        .then((resp) => resp.json()) // transform the data into json
        .then(function (data) {
          let rows = data.results.bindings.map((poster) => {
            let obj = {
              img: poster.img.value.replace('level3', 'level2'),
              description: poster.description.value,
              title: poster.title.value.substring(0, poster.title.value.length - 1),
              subject: poster.subject.value,
              date: poster.date.value.substring(0, 4)
            }
            return obj
          })
          var singleData = []
          var unique = {}
          // Remove duplicates: https://vikasrao.wordpress.com/2011/06/09/removing-duplicates-from-a-javascript-object-array/
          dojo.forEach(rows, function (item) {
            if (!unique[item.img]) {
              singleData.push(item)
              unique[item.img] = item;
            }
          })
          let checkData = helper.shuffle(singleData).slice(0, 50)
          let renderData = []
          let count = 0
          checkData.forEach((poster) => {
            let url = poster.img
            helper.checkImg(url, function (existsImage) {
              if (existsImage === true && count < 3) {
                count++
                renderData.push(poster)
              }
            })
          })
          let update = setInterval(() => {
            if (renderData.length === 3) {
              clearInterval(update)
             template.renderDialog(renderData, posterData, index)
            }
          }, 100)
        })
    }
  }

  const template = {
    renderPosters: function (data) {
      loader.style.display = 'none'
      items = []
      data.forEach((poster, i) => {
        items +=
          `<li>
            <picture>
              <img src="${poster.img}" alt="${poster.title}">
            </picture>
            <div>
            <article>
              <h1>${poster.title}</h1>
              <p>${poster.description}</p>
              </article>
              <time datetime="2017-02-14">Ca. ${poster.date}</time>
            </div>
          </li>`
      })
      helper.replaceHTML(global.elements.list, items)
      console.log('render posters')
      this.handleEvents(data)
    },
    renderDialog: function(moreImgs, posterData, i) {
      const modal = document.querySelector('#modal')
      const dialog = document.querySelector('dialog')
      const closeButton = document.querySelector('#close')
      let subject = posterData[i].subject.substring(0, posterData[i].subject.length - 1).toLowerCase()
      let hdUrl = posterData[i].img.replace('level3', 'level2')
      let dialogContent = `

      <div class="loaderposter">
        <div class="loader" id="loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
      </div>
      <a href="${hdUrl}" target="_blank">
        <picture>
          <img src="${posterData[i].img}" alt="${posterData[i].title}">
        </picture>
      </a>
      <article>
        <footer>
          <h1>${posterData[i].title}</h1>
          <time datetime="${posterData[i].date}">Ca. ${posterData[i].date}</time>
          <p>${posterData[i].description}</p>
        </footer>
        <section>
          <h2>Meer ${subject} posters</h2>
          <img src="${moreImgs[0].img}" alt="${moreImgs[0].title}">
          <img src="${moreImgs[1].img}" alt="${moreImgs[1].title}">
          <img src="${moreImgs[2].img}" alt="${moreImgs[2].tile}">
        </section>
      </article>
      `
      helper.replaceHTML(modal, dialogContent)
      global.elements.maindialog.style.display = 'block'
      document.querySelector('.loaderposter').style.display = 'none'
      if (!dialog.open) {
        
      global.elements.maindialog.style.display = 'block'
      }
      closeButton.addEventListener('click', () => {
        
      global.elements.maindialog.style.display = 'none'
      })
      window.addEventListener('click', (e)=> {
        if(e.target === dialog) {
          
      global.elements.maindialog.style.display = 'none'
        }
      })
      let relatedPosters = document.querySelectorAll('#modal section img')
      relatedPosters.forEach((poster, i)=> {
        poster.addEventListener('click', function() {
          api.moreImg(moreImgs[i].subject, moreImgs, i)
          document.querySelector('.loaderposter').style.display = 'flex'
        })
      })
    },
    handleEvents: function (data) {
      let posters = document.querySelectorAll('ol li')
      posters.forEach((poster, i) => {
        poster.style.animationDelay = `${i * 100}ms`
        poster.addEventListener('click', function () {
          api.moreImg(data[i].subject, data, i)
        })
      })

      let categoryList = document.querySelector('select')

      categoryList.addEventListener('change', function () {
        let selected = categoryList.value
        if (selected !== 'All') {
          curCategory = global.elements.categories[selected]
        } else {
          curCategory = false
        }
        global.elements.curCategory = curCategory
        app.handleEvents(curCategory)
      })

      let search = document.querySelector('input')
      search.addEventListener('change', function() {
        app.handleEvents(global.elements.curCategory, search.value)
      })
    }
  }

  const helper = {
    // Shuffle items in an array, from: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    shuffle: (a) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    // Capitalize first letter in string, from: https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
    capitalize: (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1)
    },
    // Check if image exists, from: https://bharatchodvadiya.wordpress.com/2015/04/08/how-to-check-if-an-image-exists-using-javascript/
    checkImg: async (imageUrl, callBack) => {
      var imageData = new Image();
      imageData.onload = function () {
        callBack(true);
      };
      imageData.onerror = function (e) {
        e.preventDefault()
        callBack(false);
      };
      imageData.src = imageUrl;
    },
    emptyElement: function (element) { // empty an html element
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
    },
    replaceHTML: function (element, string) { // empty html and insert new value
      this.emptyElement(element)
      element.insertAdjacentHTML('beforeend', string)
    },
    checkDuplicate: function (img) {
      let bool
      global.elements.singleData.forEach((item) => {
        if (item.img === img) {
          bool = true
          return false
        } else if (!bool) {
          bool = false
        }
      })
      return bool
    }
  }
  app.init()
})()