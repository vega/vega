import {Transform, visitChunked} from 'vega-dataflow';
import {falsy, inherits, isArray} from 'vega-util';

const SCHEDULING_BATCH = 256;

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} [params.mod=false] - Flag indicating if tuples in the input
 *   mod set that are unmodified by encoders should be included in the output.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
export default function Encode(params) {
  Transform.call(this, null, params);
}

function collect(pulse, flags) {
  const tuples = [];
  pulse.visit(flags, t => { tuples.push(t); });
  return tuples;
}

function encodeSize(pulse, modified) {
  const n = pulse.add.length + pulse.rem.length + pulse.mod.length;
  return modified && pulse.source ? n + pulse.source.length : n;
}

async function encodeChunked(pulse, out, scheduler, enc) {
  if (pulse.changed(pulse.ADD)) {
    const add = collect(pulse, pulse.ADD);
    await visitChunked(add, enc.visitAdd, scheduler, SCHEDULING_BATCH);
    out.modifies(enc.enter.output);
    out.modifies(enc.update.output);
    if (enc.set !== falsy && enc.set !== enc.update) {
      await visitChunked(add, enc.visitSet, scheduler, SCHEDULING_BATCH);
      out.modifies(enc.set.output);
    }
  }

  if (pulse.changed(pulse.REM) && enc.exit !== falsy) {
    await visitChunked(
      collect(pulse, pulse.REM), enc.visitExit, scheduler, SCHEDULING_BATCH
    );
    out.modifies(enc.exit.output);
  }

  if (enc.reenter || enc.set !== falsy) {
    const flag = pulse.MOD | (enc.modified ? pulse.REFLOW : 0),
          tuples = collect(pulse, flag);
    if (enc.reenter) {
      await visitChunked(tuples, enc.visitReenter, scheduler, SCHEDULING_BATCH);
      if (out.mod.length) out.modifies(enc.enter.output);
    } else {
      await visitChunked(tuples, enc.visitMod, scheduler, SCHEDULING_BATCH);
    }
    if (out.mod.length) out.modifies(enc.set.output);
  }

  return out.changed() ? out : pulse.StopPropagation;
}

inherits(Encode, Transform, {
  transform(_, pulse) {
    var out = pulse.fork(pulse.ADD_REM),
        fmod = _.mod || false,
        encoders = _.encoders,
        encode = pulse.encode,
        modified = _.modified(),
        scheduler = pulse.dataflow._scheduler;

    // if an array, the encode directive includes additional sets
    // that must be defined in order for the primary set to be invoked
    // e.g., only run the update set if the hover set is defined
    if (isArray(encode)) {
      if (out.changed() || encode.every(e => encoders[e])) {
        encode = encode[0];
        out.encode = null; // consume targeted encode directive
      } else {
        return pulse.StopPropagation;
      }
    }

    // marshall encoder functions
    var reenter = encode === 'enter',
        update = encoders.update || falsy,
        enter = encoders.enter || falsy,
        exit = encoders.exit || falsy,
        set = (encode && !reenter ? encoders[encode] : update) || falsy;

    const enc = {
      reenter, update, enter, exit, set, modified,

      visitAdd(t) { enter(t, _); update(t, _); },

      visitSet(t) { set(t, _); },

      visitExit(t) { exit(t, _); },

      visitReenter(t) {
        const mod = enter(t, _) || fmod;
        if (set(t, _) || mod) out.mod.push(t);
      },

      visitMod(t) {
        if (set(t, _) || fmod) out.mod.push(t);
      }
    };

    if (scheduler && !pulse.pulses && encodeSize(pulse, modified) > SCHEDULING_BATCH) {
      return encodeChunked(pulse, out, scheduler, enc);
    }

    if (pulse.changed(pulse.ADD)) {
      pulse.visit(pulse.ADD, enc.visitAdd);
      out.modifies(enter.output);
      out.modifies(update.output);
      if (set !== falsy && set !== update) {
        pulse.visit(pulse.ADD, enc.visitSet);
        out.modifies(set.output);
      }
    }

    if (pulse.changed(pulse.REM) && exit !== falsy) {
      pulse.visit(pulse.REM, enc.visitExit);
      out.modifies(exit.output);
    }

    if (reenter || set !== falsy) {
      const flag = pulse.MOD | (modified ? pulse.REFLOW : 0);
      if (reenter) {
        pulse.visit(flag, enc.visitReenter);
        if (out.mod.length) out.modifies(enter.output);
      } else {
        pulse.visit(flag, enc.visitMod);
      }
      if (out.mod.length) out.modifies(set.output);
    }

    return out.changed() ? out : pulse.StopPropagation;
  }
});
