
function remove(array, element) {
  const index = array.indexOf(element);
  array.splice(index, 1);
}

/**
 * Delay processing. Returns a promise.
 * @param {Number} ms Time to sleep in ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * expectEvents
 * @param {Object} client Circuit client instance
 * @param {Object[]} events Array with event type and optional predicate function
 * @returns {Promise}
 */
export function expectEvents(client, events) {
  return new Promise((resolve, reject) => {
    events = events.map(e =>
      typeof e === 'string' ? { type: e, predicate: () => { return true; } } : e
    )
    events.forEach(event => client.addEventListener(event.type, evt => {
      const matchingEvents = events.filter(e => e.type === evt.type);
      if (matchingEvents.length) {
        const resolvedEvents = matchingEvents.filter(me => !me.predicate || me.predicate(evt));
        resolvedEvents.forEach(re => remove(events, re));
        !events.length && resolve(evt);
      }
    }));
  });
}

export function logEvents(client, events) {
  events.forEach(e =>
    client.addEventListener(e, evt => {
      let msg = `Received ${e} event.`;
      evt.reason && (msg += ` Reason: ${evt.reason}.`);
      evt.call && (msg += ` State: ${evt.call.state}.`);
      console.log(msg);
    })
  );
}

export function updateRemoteVideos(client) {
  client.addEventListener('callStatus', evt => {
    evt.call.participants.forEach((p, i) => {
      const el = document.querySelector(`#peerVideo${i}`);
      if (el && el.src !== evt.call.participants[i].videoUrl) {
        el.src = evt.call.participants[i].videoUrl || '';
      }
    });
  });
  client.addEventListener('callEnded', evt => {
    evt.call.participants.forEach((p, i) => {
      const el = document.querySelector(`#peerVideo${i}`);
      el && (el.src = '');
    });
  });
}

export function clearAllVideos() {
  for (let node of document.querySelectorAll('video')) {
    node.src = '';
  }
}
