// version 1.04 template index made by heine.froholdt@gmail.com

let isOn = false;
let framesMilliseconds;
let fontsLoaded = false;
let animLoaded = false;
let animElementsLength;
let markers = {}
let markersLoop = {}

//loop handling
let loopExits = false;
let loopAnimation = false;
let loopDelay = 0;
let loopExternal = false;
let loopRepeat;
let loopDuration;
let loopTiming;


//update
let updateAnimation = false;
let updateDelay = 0;
let nextAnimation;
let imagesReplace = {};


//data de equipos
let equipo

var data_equipos = {
    "aguilas": {
        "color_texto": [0,0,0],
        "color": "#FABE40"
    },
    "leones": {
        "color_texto": [0.992,0.749,0.165],
        "color": "#00246B"
    },
    "tigres": {
        "color_texto": [1,1,1],
        "color": "#D70062"
    },
    "magallanes": {
        "color_texto": [0.1,0.2,0.8],
        "color": "#FFE208"
    },
    "tiburones": {
        "color_texto": [1,1,1],
        "color": "#D0005B"
    },
    "cardenales": {
        "color_texto": [1,1,1],
        "color": "#9A1720"
    },
    "bravos": {
        "color_texto": [0,0,0],
        "color": "#41C3CB"
    },
    "caribes": {
        "color_texto": [1,1,1],
        color: "#F2902B"
    }
}

let animContainer = document.getElementById('bm');
let loopContainer = document.getElementById('loop');


const loadAnimation = (data, container) => {
    console.log('loading ' + data)
    return lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: data
    });
    
}


// myAnimationData and equipo comes from the HTML file
let anim = loadAnimation("alineacion.json", animContainer)
let externalLoop;

//add font-face from data.json  
const addFont = (fam, path) => {
    let newFont = document.createElement('style')
    newFont.appendChild(document.createTextNode(`\
    @font-face {\
        font-family: ${fam};\
        src: url('${path}');\
    }\
    `));
    document.head.appendChild(newFont);
}


//checking if the animation is ready
const makeAnimPromise = () => {
    return new Promise(function (resolve, reject) {
        if (animLoaded) {
            resolve('Animation ready to play')
        } else {
            anim.addEventListener('DOMLoaded', function (e) {
                animLoaded = true;
                resolve('Animation ready to play')
               
            });
        }
    })
};


const isMarker = (obj, keyItem, markerName) => {
    return new Promise((resolve, reject) => {
        let markers = obj.markers
        markers.forEach((item, index) => {
            for (let key in item) {
                if (item[key][keyItem] === markerName) {
                    resolve(true)
                } else if (item.length === key) {
                    reject(false)
                }
            }
        })
    })
}

const getMarkerValue = (obj, keyItem, defaultValue) => {
    return new Promise((resolve, reject) => {
        let markers = obj.markers
        markers.forEach((item, index) => {
            for (let key in item) {
                if (item[key].hasOwnProperty(keyItem)) {
                    resolve(item[key][keyItem])
                } else if (item.length === key) {
                    reject(defaultValue)
                }
            }
        })
    })
}



config_ready = () => {
    let mainAnimation = anim.renderer.data
    framesMilliseconds = 1000 / mainAnimation.fr

    if (anim.hasOwnProperty('markers')) {
        anim.markers.forEach((item, index) => {
            markers[item.payload.name] = item;
        })
    }
    //checking for a loop in the animation
    isMarker(anim, 'name', 'loop').then((res) => {
        loopAnimation = res

        if (res) {
            loopExits = true;
            getMarkerValue(anim, 'loopDelay', 0).then((res) => {
                loopDelay = Number(res)
            })
            getMarkerValue(anim, 'loopExternal', false).then((res) => {
                loopExternal = (res === 'true')

                //handling of external loop
                if (loopExternal) {

                    externalLoop = loadAnimation('loop.json', loopContainer)
                    if (externalLoop.hasOwnProperty('markers')) {
                        externalLoop.markers.forEach((item, index) => {
                            markersLoop[item.payload.name] = item;
                
                        })
                    }
                    externalLoop.addEventListener('complete', () => {
                        if (nextAnimation !== 'stop') {
                            loopRepeat = setTimeout(() => {
                                externalLoop.goToAndPlay('loop', true);
                            }, framesMilliseconds * loopDelay)

                        } else if (isOn && nextAnimation === 'stop') {
                            externalLoop.goToAndPlay('stop', true);
                            anim.goToAndPlay('stop', true)
                            nextAnimation === 'no animation'
                            isOn = false;
                        }

                    })
                }


            })
            if(!loopExternal){
                loopDuration = markers['loop']['duration']
            } else {
                loopDuration = markersLoop['loop']['duration']
            }
          
        }
    })
    //checking for a update animation in the animation 
    isMarker(anim, 'name', 'update').then((res) => {
        updateAnimation = res
        if (res) {
            getMarkerValue(anim, 'updateDelay', 0).then((res) => {
                updateDelay = Number(res)
            })
        }
    })

    //Add fonts to style
    if (!fontsLoaded) {
        let fonts = anim.renderer.data.fonts.list;
        for (const font in fonts) {
            let family = fonts[font].fFamily
            let fontPath = fonts[font].fPath
            if (fontPath !== '') {
                addFont(family, fontPath)
            }
        }
        
    }
}


//anim ready
anim.addEventListener('config_ready', function (e) {
    //setting the animation framerate
    config_ready()

});

const animPromise = makeAnimPromise()

webcg.on('data', function (data) {
    let updateTiming = 50
    console.log('data from casparcg received')
    
    var key; 
    for (key in data) {
        console.log(key + " = " + data[key]); 
       // if (key.includes("equipo")){checkandupdate("c0",data[key])}
    } 
    console.log('End of my test segment')
    animPromise.then(resolve => {
            if (anim.currentFrame !== 0 && updateAnimation) {
                updateTiming = framesMilliseconds * (updateDelay + loopTiming)
                if (anim.isPaused && isOn) {
                    anim.goToAndPlay('update', true)
                    if (!loopExternal) {
                        clearTimeout(loopRepeat);
                    }

                } else {
                    loopAnimation = false;
                    nextAnimation = 'update'
                }
            } else if(!loopExternal && loopExits && anim.isPaused) {
                anim.goToAndPlay('loop', true)
            }

            let imageElements = animContainer.getElementsByTagName("image");
            animElementsLength = anim.renderer.elements.length;
            console.log(resolve)

            setTimeout(() => {
                for (let i = 0; i < animElementsLength; i++) {
                    var animElement = anim.renderer.elements[i];
                    if (
                        animElement.hasOwnProperty('data') && animElement.data.hasOwnProperty('cl') &&
                        data && data.hasOwnProperty(animElement.data.cl)
                    ) {
                        let cl = animElement.data.cl;
                        let searchPath;
                        let newPath;

                        if (animElement.data.hasOwnProperty('refId') && animElement.data.refId.includes('image')) {
                            team = data[cl] ? data[cl].text || data[cl] : '';
                            newPath = `images/${team}.png`
                            console.log(newPath)
                            anim.assets.forEach((item, index) => {
                                if (item.id === animElement.data.refId) {
                                    if (imagesReplace.hasOwnProperty(animElement.data.refId)) {
                                        searchPath = imagesReplace[animElement.data.refId];
                                    } else {
                                        searchPath = `${anim.assets[index].u}${anim.assets[index].p}`;
                                    }
                                }
                            })
                            console.log(searchPath)
                            for (let i = 0; i < imageElements.length; i++) {
                                const element = imageElements[i];
                                if (~element.getAttribute("href").search(searchPath)) {
                                    element.setAttribute("href", newPath);
                                    imagesReplace[animElement.data.refId] = newPath
                                }
                            };


                        } else {
                            try {
                                animElement.canResizeFont(true);
                                animElement.updateDocumentData({
                                    t: data[cl] ? data[cl].text || data[cl] : ''
                                }, 0);

                                if (animElement.data.hasOwnProperty('color')){ // esto es solo necesario si la barra activa es diferente --> && animElement.data.lineup !== current_bat){
                                    console.log(`Color: ${animElement.data.nm}`);
                                     animElement.updateDocumentData({
                                  t: data[cl] ? data[cl].text || data[cl] : '', fc: data_equipos[equipo].color_texto}, 0); // Update the text y coloreamos Negro
                                     
                                 }

                            } catch (err) {
                                console.log(err)
                            }
                        };
                    }
                }

            }, updateTiming);

        })
        .catch(error => console.log(error))
});


//what to do everytime main animation is done playing
anim.addEventListener('complete', () => {

    if (loopAnimation && isOn && !loopExternal) {
        loopRepeat = setTimeout(() => {
            anim.goToAndPlay('loop', true);
        }, framesMilliseconds * loopDelay)

    } else if (nextAnimation === 'stop' && isOn && !loopExternal) {
        anim.goToAndPlay(nextAnimation, true)
        isOn = false

    } else if (isOn && nextAnimation !== 'no animation' && !loopExternal) {
        anim.goToAndPlay(nextAnimation, true)
        if (loopExits && !loopExternal) {
            loopAnimation = true;

        }

        nextAnimation = 'no animation'
    }
})

//Custom methods

function update_color(campo,color){
    var fill_color = `.${campo}`
    document.querySelector(fill_color).style.setProperty("stroke", color);
}

function update_opacidad(campo,value){
    var fill = `.${campo}`
   console.log(campo)
    document.querySelector(fill).style.setProperty("opacity", value);
}


function checkandupdate(item, equipo, attempts = 0) {
    const maxAttempts = 10;
    let value = data_equipos[equipo].color;
    if (itemExists(item)) {
        console.log(`checkandupdate: ${item} -- exists`);
        update_color(item, value);
        console.log(`checkandupdate: ${item} -- updated with ${value}`);
    } else if (attempts < maxAttempts) {
        console.log(`checkandupdate: ${item} --- waiting (attempt ${attempts + 1})`);
        setTimeout(function() {
            checkandupdate(item, value, attempts + 1);
        }, 100);
    } else {
        console.log(`checkandupdate: ${item} -- reached max attempts (${maxAttempts})`);
    }
}

function itemExists(item) {
    var fill = `.${item}`
   //return document.querySelector(item).style !== false;
   return document.querySelector(fill) !== null;
}


function clear_logos(teamNameToSkip){
    for (var team in equipos) {
        if (team !== teamNameToSkip) {
            equipos[team].forEach(function(item) { 
                checkandupdate(item);
            });
        }
    }
}

function update_equipos(nombre_equipo,homevisit){
    // homevisit puede ser "visitante" o "homeclub"
    var campos = opacidad_equipos[homevisit]
    for (var j = 0; j < campos.length; j++) {
        var campo = campos[j];
        var combination = campo + nombre_equipo;
        update_opacidad(combination,1);
    }  
}



//casparcg control
webcg.on('play', function () {
    animPromise.then((resolve) => {
        console.log('play')
        anim.goToAndPlay('play', true);
        if (loopExits && loopExternal) {
            externalLoop.goToAndPlay('play', true);
        }
        isOn = true;
    });

});

webcg.on('show', function () {
    anim.setDirection(1);
    animPromise.then((resolve) => {
        console.log('show')
        anim.goToAndPlay('show', true);
        isOn = true;
    });

});

webcg.on('hide', function () {
   console.log("this is hide!")
    anim.setDirection(-1);
    anim.playSegments([60, 0.1], true);
    isOn = false;
   

});


webcg.on('stop', function () {
    console.log('stop')
    clearTimeout(loopRepeat);
    loopAnimation = false;
    //nextAnimation = 'stop'
        if (!loopExternal) {
            anim.goToAndPlay('stop', true)
            isOn = false
        }

});

webcg.on('playAnimation', function (animationName) {
    console.log('playAnimation ' + animationName)
    anim.goToAndPlay(animationName, true);
});

webcg.on('update', function () {
    if (!loopExternal) {
        clearTimeout(loopRepeat);
    }

    if (anim.isPaused || loopExternal) {
        loopTiming = 0

    } else if (isOn) {
        loopTiming = loopDuration - Math.round(anim.currentFrame)

    }
});
