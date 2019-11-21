/**
 * run the server - listening to URLS of the form
 * pitaka.lk/main?n=15111&p=12
 * render the main/index.html while replacing the text table with prerendered text
 * 
 * For development run from the 'dev' folder
 * nodemon -w  .\static-server\ .\static-server\server.js
 * 
 * For production run from inside the dev folder
 * pm2 start ./static-server/server.js --name "pitaka.lk-server"
 */

const fs = require('fs');
const path = require('path');
const lt = require('./load-text.js');
const fastify = require('fastify')({ logger: false, ignoreTrailingSlash: true });

const indexHtml = fs.readFileSync('../main/index.html', { encoding: 'utf-8' });

async function sendRenderedText(request, reply) {
    const nodeId = request.params.node;
    const paraId = request.params.para;
    await loadTextDoc(nodeId, paraId, reply);
}

async function loadTextDoc(nodeId, paraId, reply) {
    const {text, title, desc} = await lt.getRenderedText(nodeId, paraId);
    let newHtml = indexHtml.replace(/<title>.+?<\/title>/, `<title>${title}</title>`);
    newHtml = newHtml.replace('<meta property="og:title" content="">', `<meta property="og:title" content="${title}">`);
    newHtml = newHtml.replace('<meta property="og:description" content="">', `<meta property="og:description" content="${desc}">`);
    const url = `https://pitaka.lk/main?n=${nodeId}${paraId ? '&p=' + paraId : ''}`;
    newHtml = newHtml.replace('<meta property="og:url" content="">', `<meta property="og:url" content="${url}">`);
    newHtml = newHtml.replace('<tbody id="text-view-tbody"></tbody>', '<tbody id="text-view-tbody">' + text + '</tbody>');
    reply.type('text/html');
    reply.send(newHtml);
}


// pitaka.lk/main?n=15111&p=12 para is optional
fastify.get('/main', async (request, reply) => {
    const nodeId = request.query.n;
    const paraId = request.query.p;
    if (!nodeId || isNaN(parseFloat(nodeId))) { // home page
        reply.type('text/html');
        reply.send(indexHtml);
        return;
    }
    await loadTextDoc(nodeId, paraId, reply);
});

// only for dev purposes
fastify.register(require('fastify-static'), {
    root: path.join(process.cwd(), '..'),
    //prefix: '/public/', // optional: default '/'
});
// adding the following breaks the static serving above
//fastify.get('/:node(^\\d+)/', sendRenderedText); // support for old urls
//fastify.get('/:node(^\\d+)/:para(^\\d+)', sendRenderedText);

fastify.ready(() => console.log(fastify.printRoutes()));

// Run the server!
fastify.listen(3080, function (err, address) {
    if (err) {
        console.log(err);
        process.exit(1)
    }
    console.log(`server listening on ${address}`)
});