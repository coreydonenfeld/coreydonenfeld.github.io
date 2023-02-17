/************Initialize JazzyScroll************/

// Only initialize JazzyScroll if the user does not prefer reduced motion.
let isMotionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)');
if (isMotionAllowed.matches) {
	const JAZZYSCROLL = new JazzyScroll({
		speed: 800,
		delay: 0,
		offset: 0
	});
}