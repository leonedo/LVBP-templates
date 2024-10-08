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
let updateDelay = 30;
let nextAnimation;
let imagesReplace = {};

let animContainer = document.getElementById('bm');
let loopContainer = document.getElementById('loop');


const loadAnimation = (data, container) => {
    console.log('loading ' + data)
    return lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: data,
        rendererSettings: {hideOnTransparent:false}
    });
}

let anim = loadAnimation('barras.json', animContainer)
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



//anim ready
anim.addEventListener('config_ready', function (e) {
    //setting the animation framerate
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

});

const animPromise = makeAnimPromise()

webcg.on('data', function (data) {
    let updateTiming = 0
    let updateJugador = false
    console.log('data from casparcg received')
    
    var key; 
    for (key in data) {
        console.log(key + " = " + data[key]); 
        //if (key.includes("equipo")){update_equipo(data[key])}
        //if ( key.includes("out") || key.includes("basellena") || key.includes("parte")){update_opacidad(key,data[key])}
        if (key === "update"){updateJugador = data[key]}
    } 
    console.log('End of my test segment')
    animPromise.then(resolve => {
            if (anim.currentFrame !== 0 && updateAnimation) {
                updateTiming = framesMilliseconds * (updateDelay + loopTiming)
                if (anim.isPaused && isOn) {
                    console.log("updateJugador:" + updateJugador)
                   if (updateJugador === "visitante"){
                     anim.goToAndPlay('visita', true)
                   }else if (updateJugador === "local"){
                     anim.goToAndPlay('local', true)  
                    }else {
                        updateTiming = 2
                        anim.goToAndPlay('update', true)
                    }
                    
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
                            newPath = data[cl] ? data[cl].text || data[cl] : '';
                            anim.assets.forEach((item, index) => {
                                if (item.id === animElement.data.refId) {
                                    if (imagesReplace.hasOwnProperty(animElement.data.refId)) {
                                        searchPath = imagesReplace[animElement.data.refId];
                                    } else {
                                        searchPath = `${anim.assets[index].u}${anim.assets[index].p}`;
                                    }
                                }
                            })

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
    document.querySelector(fill_color).style.setProperty("fill", color);
}

function update_opacidad(campo,value){
    var fill = `.${campo}`
    document.querySelector(fill).style.setProperty("opacity", value);
}

function clear_logos(){
    for (var equipoKey in opacidad_equipos) {
        if (opacidad_equipos.hasOwnProperty(equipoKey)) {
            // Iterate through equipos
            for (var i = 0; i < equipos.length; i++) {
                var equipo = equipos[i];
                var campos = opacidad_equipos[equipoKey];
                
                // Generate combinations and call update_opacidad
                for (var j = 0; j < campos.length; j++) {
                    var campo = campos[j];
                    var combination = campo + equipo;
                    
                    update_opacidad(combination,"0")
                }
            }
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
      anim.goToAndPlay('play', true);  
      console.log('play')
        isOn = true;
    });

});

webcg.on('show_both', function () {
    anim.setDirection(1);
    animPromise.then((resolve) => {
        console.log('show')
        anim.setSpeed(1)
        anim.goToAndPlay('show', true);
        isOn = true;
    });

});

webcg.on('hide_both', function () {
   console.log("this is hide!")
    anim.playSegments([220, 250], true);
    anim.playSegments([-5, -1], false);
    isOn = false;
   

});



webcg.on('update_visitante', function () {
  anim.playSegments([45, 125], true);
 isOn = true;
  
});

webcg.on('update_local', function () {
    anim.playSegments([120, 200], true);
   isOn = true;
    
  });
  



webcg.on('full', function () {
  anim.setDirection(1);
  animPromise.then((resolve) => {
      console.log('full')
      anim.setSpeed(1)
      anim.goToAndPlay('full', true);
      isOn = true;
  });

});


webcg.on('stop', function () {
    console.log('stop')
    clearTimeout(loopRepeat);
    loopAnimation = false;
    nextAnimation = 'stop'

    if (anim.isPaused) {
        if (!loopExternal) {
            anim.goToAndPlay('stop', true)
            isOn = false
        }

        if (loopExits && loopExternal && externalLoop.isPaused) {
            externalLoop.goToAndPlay('stop', true);
            anim.goToAndPlay('stop', true)
            isOn = false
        }
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
