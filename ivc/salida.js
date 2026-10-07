// Contrato de salida (B-1): el mismo que releaseLayer() de LVBP-Meridiano.
//
// Para CasparCG un CG STOP es sólo llamar a stop() en la página: la capa sigue ocupada,
// con el gráfico invisible, para siempre. window.remove(), que CasparCG inyecta en cada
// página, la cierra y suelta la capa; el OSC deja de publicar el producer de esa capa, y
// así sabe quien controla que quedó libre.
//
// Se carga después del .js del template (usa su `anim`) y sólo escucha 'stop': los INVOKE
// ('hide' del score con F1/F5/F6, 'show', 'hide_both'...) no pasan por aquí.
//
// ⚠ `remove` es un nombre global reservado: un template que declare su propia
// function remove() tapa la de CasparCG, y dejan de funcionar esto y CG REMOVE.
(() => {
    // Lo más que la animación puede estar sin avanzar en plena salida antes de soltar la
    // capa igual (el JSON no cargó, no hay nada que reproducir). Holgado a propósito: es
    // una red para un gráfico roto, no un plazo para uno que funciona.
    const EXIT_FALLBACK_MS = 5000
    let exiting = false
    let exitFallback = null

    const releaseLayer = () => {
        exiting = false
        clearTimeout(exitFallback)
        // Fuera de CasparCG, o en uno sin window.remove, no hace nada: todo sigue como hoy.
        if (typeof window.remove === 'function') {
            window.remove()
        } else {
            console.info('[stop] sin window.remove(): la capa se queda como hoy')
        }
    }

    const armExitFallback = () => {
        clearTimeout(exitFallback)
        exitFallback = setTimeout(releaseLayer, EXIT_FALLBACK_MS)
    }

    webcg.on('stop', () => {
        exiting = true
        armExitFallback()
    })

    // Volver al aire antes de que termine la salida la cancela.
    webcg.on('play', () => {
        exiting = false
        clearTimeout(exitFallback)
    })

    // Mientras la animación avanza, el respaldo no corre: en la familia 1.04 el stop espera
    // a que acabe el segmento en curso, y hay 'play' de 17 y de 40 s.
    anim.addEventListener('enterFrame', () => {
        if (exiting) armExitFallback()
    })

    // La salida termina cuando la animación se queda parada. Este 'complete' se registra
    // después del del template: si éste encadenó otro segmento (el stop diferido), la
    // animación ya no está en pausa y se sigue esperando.
    anim.addEventListener('complete', () => {
        if (exiting && anim.isPaused) releaseLayer()
    })
})()
