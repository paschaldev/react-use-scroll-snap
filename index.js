import { useRef, useState, useEffect, useCallback } from 'react';

function useScrollSnap({ ref = null }) {
    const isActiveInteractionRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const currentScrollOffsetRef = useRef(null);
    const [scrollIndex, setScrollIndex] = useState(0);

    // Modified from https://stackoverflow.com/a/125106
    const getElementsInView = useCallback(() => {
        const elements = [].slice.call(ref.current.children); // Need to convert HTMLCollection to native JS Array
        return elements.filter((element) => {
            let top = element.offsetTop;
            const height = element.offsetHeight;
            while (element.offsetParent) {
                element = element.offsetParent;
                top += element.offsetTop;
            }
            return top < (window.pageYOffset + window.innerHeight) && (top + height) > window.pageYOffset;
        });
    }, [ref]);

    const getTargetScrollOffset = useCallback((element) => {
        let top = element.offsetTop;
        while (element.offsetParent) {
            element = element.offsetParent;
            top += element.offsetTop;
        }
        return top;
    }, []);

    const snapToTarget = useCallback((target) => {
        const elements = [].slice.call(ref.current.children);
        elements.forEach((element, index) => {
            if (element.isSameNode(target)) {
                setScrollIndex(index);
            }
        });
    }, [ref, getTargetScrollOffset]);

    const findSnapTarget = useCallback(() => {
        const deltaY = window.pageYOffset - currentScrollOffsetRef.current;
        currentScrollOffsetRef.current = window.pageYOffset;

        const elementsInView = getElementsInView();
        if (!elementsInView || elementsInView.length < 2) return;

        if (deltaY > 0) {
            snapToTarget(elementsInView[1]);
        } else {
            snapToTarget(elementsInView[0]);
        }
    }, [getElementsInView, snapToTarget]);

    const onInteractionStart = useCallback(() => {
        isActiveInteractionRef.current = true;
    });

    const onInteractionEnd = useCallback(() => {
        isActiveInteractionRef.current = false;
        findSnapTarget();
    }, [findSnapTarget]);

    const onInteraction = useCallback(() => {
        if (scrollTimeoutRef) clearTimeout(scrollTimeoutRef.current);
        if (isActiveInteractionRef.current) return;

        scrollTimeoutRef.current = setTimeout(findSnapTarget, 500);
    }, [findSnapTarget]);

    useEffect(() => {
        if (ref) {
            document.addEventListener('keydown', onInteractionStart, { passive: true });
            document.addEventListener('keyup', onInteractionEnd, { passive: true });
            document.addEventListener('touchstart', onInteractionStart, { passive: true });
            document.addEventListener('touchend', onInteractionEnd, { passive: true });
            document.addEventListener('wheel', onInteraction, { passive: true });

            findSnapTarget();

            return () => {
                document.removeEventListener('keydown', onInteractionStart, { passive: true });
                document.removeEventListener('keyup', onInteractionEnd, { passive: true });
                document.removeEventListener('touchstart', onInteractionStart, { passive: true });
                document.removeEventListener('touchend', onInteractionEnd, { passive: true });
                document.removeEventListener('wheel', onInteraction, { passive: true });
            }
        }
    }, [
        ref,
        findSnapTarget,
        onInteractionStart,
        onInteractionEnd,
        onInteraction
    ]);

    return scrollIndex;
}

export default useScrollSnap;
