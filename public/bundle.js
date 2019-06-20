
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = cb => requestAnimationFrame(cb);

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick: tick$$1 = noop, css } = config;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick$$1(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now$$1 => {
                if (running) {
                    if (now$$1 >= end_time) {
                        tick$$1(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now$$1 >= start_time) {
                        const t = easing((now$$1 - start_time) / duration);
                        tick$$1(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            if (detaching)
                component.$$.fragment.d(1);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/App.svelte generated by Svelte v3.5.2 */

    const file = "src/App.svelte";

    // (48:0) {#if show}
    function create_if_block(ctx) {
    	var div0, t0, div1, div1_intro, t1, div2, div2_intro, t2, div3, div3_intro, t3, div4, div4_intro, t4, div5, div5_intro, t5, div6, div6_intro, t6, div7, div7_intro, t7, div8, div8_intro;

    	return {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			set_style(div0, "height", "calc(100vh + 100px)");
    			set_style(div0, "width", "99000px");
    			add_location(div0, file, 48, 2, 972);
    			attr(div1, "id", "b8");
    			attr(div1, "class", "b svelte-y1g1f0");
    			set_style(div1, "background-position-x", "0px");
    			add_location(div1, file, 49, 2, 1037);
    			attr(div2, "id", "b7");
    			attr(div2, "class", "b svelte-y1g1f0");
    			set_style(div2, "background-position-x", "" + ctx.bx/500 + "px");
    			set_style(div2, "background-position-y", "" + ctx.by/20 + "px");
    			add_location(div2, file, 52, 2, 1170);
    			attr(div3, "id", "b6");
    			attr(div3, "class", "b svelte-y1g1f0");
    			set_style(div3, "background-position-x", "" + ctx.bx/32 + "px");
    			set_style(div3, "background-position-y", "" + ctx.by/10 + "px");
    			add_location(div3, file, 55, 2, 1343);
    			attr(div4, "id", "b5");
    			attr(div4, "class", "b svelte-y1g1f0");
    			set_style(div4, "background-position-x", "" + ctx.bx/16 + "px");
    			set_style(div4, "background-position-y", "" + ctx.by/8 + "px");
    			add_location(div4, file, 58, 2, 1515);
    			attr(div5, "id", "b4");
    			attr(div5, "class", "b svelte-y1g1f0");
    			set_style(div5, "background-position-x", "" + ctx.bx/8 + "px");
    			set_style(div5, "background-position-y", "" + ctx.by/6 + "px");
    			add_location(div5, file, 61, 2, 1686);
    			attr(div6, "id", "b3");
    			attr(div6, "class", "b svelte-y1g1f0");
    			set_style(div6, "background-position-x", "" + ctx.bx/4 + "px");
    			set_style(div6, "background-position-y", "" + ctx.by/4 + "px");
    			add_location(div6, file, 64, 2, 1856);
    			attr(div7, "id", "b2");
    			attr(div7, "class", "b svelte-y1g1f0");
    			set_style(div7, "background-position-x", "" + ctx.bx/2 + "px");
    			set_style(div7, "background-position-y", "" + ctx.by/2 + "px");
    			add_location(div7, file, 67, 2, 2027);
    			attr(div8, "id", "b1");
    			attr(div8, "class", "b svelte-y1g1f0");
    			set_style(div8, "background-position-x", "" + ctx.bx + "px");
    			set_style(div8, "background-position-y", "" + ctx.by + "px");
    			add_location(div8, file, 70, 2, 2198);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div2, anchor);
    			insert(target, t2, anchor);
    			insert(target, div3, anchor);
    			insert(target, t3, anchor);
    			insert(target, div4, anchor);
    			insert(target, t4, anchor);
    			insert(target, div5, anchor);
    			insert(target, t5, anchor);
    			insert(target, div6, anchor);
    			insert(target, t6, anchor);
    			insert(target, div7, anchor);
    			insert(target, t7, anchor);
    			insert(target, div8, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.bx) {
    				set_style(div2, "background-position-x", "" + ctx.bx/500 + "px");
    			}

    			if (changed.by) {
    				set_style(div2, "background-position-y", "" + ctx.by/20 + "px");
    			}

    			if (changed.bx) {
    				set_style(div3, "background-position-x", "" + ctx.bx/32 + "px");
    			}

    			if (changed.by) {
    				set_style(div3, "background-position-y", "" + ctx.by/10 + "px");
    			}

    			if (changed.bx) {
    				set_style(div4, "background-position-x", "" + ctx.bx/16 + "px");
    			}

    			if (changed.by) {
    				set_style(div4, "background-position-y", "" + ctx.by/8 + "px");
    			}

    			if (changed.bx) {
    				set_style(div5, "background-position-x", "" + ctx.bx/8 + "px");
    			}

    			if (changed.by) {
    				set_style(div5, "background-position-y", "" + ctx.by/6 + "px");
    			}

    			if (changed.bx) {
    				set_style(div6, "background-position-x", "" + ctx.bx/4 + "px");
    			}

    			if (changed.by) {
    				set_style(div6, "background-position-y", "" + ctx.by/4 + "px");
    			}

    			if (changed.bx) {
    				set_style(div7, "background-position-x", "" + ctx.bx/2 + "px");
    			}

    			if (changed.by) {
    				set_style(div7, "background-position-y", "" + ctx.by/2 + "px");
    			}

    			if (changed.bx) {
    				set_style(div8, "background-position-x", "" + ctx.bx + "px");
    			}

    			if (changed.by) {
    				set_style(div8, "background-position-y", "" + ctx.by + "px");
    			}
    		},

    		i: function intro(local) {
    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fly, {delay: 50, duration: 1300, y: 700, opacity: 0.5});
    					div1_intro.start();
    				});
    			}

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fly, {delay: 250, duration: 1300, y: 700, opacity: 0.5});
    					div2_intro.start();
    				});
    			}

    			if (!div3_intro) {
    				add_render_callback(() => {
    					div3_intro = create_in_transition(div3, fly, {delay: 450, duration: 1300, y: 700, opacity: 0.5});
    					div3_intro.start();
    				});
    			}

    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, fly, {delay: 650, duration: 1300, y: 700, opacity: 0.5});
    					div4_intro.start();
    				});
    			}

    			if (!div5_intro) {
    				add_render_callback(() => {
    					div5_intro = create_in_transition(div5, fly, {delay: 850, duration: 1300, y: 700, opacity: 0.5});
    					div5_intro.start();
    				});
    			}

    			if (!div6_intro) {
    				add_render_callback(() => {
    					div6_intro = create_in_transition(div6, fly, {delay: 1050, duration: 1300, y: 700, opacity: 0.5});
    					div6_intro.start();
    				});
    			}

    			if (!div7_intro) {
    				add_render_callback(() => {
    					div7_intro = create_in_transition(div7, fly, {delay: 1250, duration: 1300, y: 700, opacity: 0.5});
    					div7_intro.start();
    				});
    			}

    			if (!div8_intro) {
    				add_render_callback(() => {
    					div8_intro = create_in_transition(div8, fly, {delay: 1450, duration: 1300, y: 700, opacity: 0.5});
    					div8_intro.start();
    				});
    			}
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t0);
    				detach(div1);
    				detach(t1);
    				detach(div2);
    				detach(t2);
    				detach(div3);
    				detach(t3);
    				detach(div4);
    				detach(t4);
    				detach(div5);
    				detach(t5);
    				detach(div6);
    				detach(t6);
    				detach(div7);
    				detach(t7);
    				detach(div8);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var scrolling = false, clear_scrolling = () => { scrolling = false; }, scrolling_timeout, if_block_anchor, dispose;

    	add_render_callback(ctx.onwindowscroll);

    	var if_block = (ctx.show) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			dispose = listen(window, "scroll", () => {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    				ctx.onwindowscroll();
    			});
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.bxx || changed.by && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				window.scrollTo(ctx.bxx, ctx.by);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: function intro(local) {
    			transition_in(if_block);
    		},

    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let bxx=0;
      let by=0;
      let show=false;
      setTimeout(()=>{$$invalidate('show', show=true);}, 1000);

    	function onwindowscroll() {
    		bxx = window.pageXOffset; $$invalidate('bxx', bxx);
    		by = window.pageYOffset; $$invalidate('by', by);
    	}

    	let bx;

    	$$self.$$.update = ($$dirty = { bxx: 1 }) => {
    		if ($$dirty.bxx) { $$invalidate('bx', bx= -1*bxx); }
    	};

    	return { bxx, by, show, bx, onwindowscroll };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
