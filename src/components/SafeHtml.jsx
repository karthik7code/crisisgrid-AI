import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Vector3, OrthographicCamera, PerspectiveCamera } from 'three';
import { useThree, useFrame } from '@react-three/fiber';

const v1 = new Vector3();
const v2 = new Vector3();
const v3 = new Vector3();

function defaultCalculatePosition(el, camera, size) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  objectPos.project(camera);
  const widthHalf = size.width / 2;
  const heightHalf = size.height / 2;
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
}

function isObjectBehindCamera(el, camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
  const deltaCamObj = objectPos.sub(cameraPos);
  const camDir = camera.getWorldDirection(v3);
  return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}

function objectScale(el, camera) {
  if (camera instanceof OrthographicCamera) {
    return camera.zoom;
  } else if (camera instanceof PerspectiveCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const vFOV = (camera.fov * Math.PI) / 180;
    const dist = objectPos.distanceTo(cameraPos);
    const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
    return 1 / scaleFOV;
  } else {
    return 1;
  }
}

function objectZIndex(el, camera, zIndexRange) {
  if (camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const dist = objectPos.distanceTo(cameraPos);
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
    const B = zIndexRange[1] - A * camera.far;
    return Math.round(A * dist + B);
  }
  return undefined;
}

export const Html = React.forwardRef(
  (
    {
      children,
      eps = 0.001,
      style,
      className,
      prepend,
      center,
      fullscreen,
      portal,
      distanceFactor,
      zIndexRange = [16777271, 0],
      calculatePosition = defaultCalculatePosition,
      as = 'div',
      wrapperClass,
      ...props
    },
    ref
  ) => {
    const { gl, camera, scene, size, events } = useThree();
    const [el] = useState(() => document.createElement(as));
    const rootRef = useRef(null);
    const groupRef = useRef(null);
    const oldZoom = useRef(0);
    const oldPosition = useRef([0, 0]);
    const isUnmountingRef = useRef(false);
    const latestContentRef = useRef(null);

    const target = portal?.current || events.connected || gl.domElement.parentNode;

    const styles = useMemo(() => {
      return {
        position: 'absolute',
        transform: center ? 'translate3d(-50%,-50%,0)' : 'none',
        ...(fullscreen && {
          top: -size.height / 2,
          left: -size.width / 2,
          width: size.width,
          height: size.height,
        }),
        ...style,
      };
    }, [style, center, fullscreen, size]);

    latestContentRef.current = (
      <div ref={ref} style={styles} className={className}>
        {children}
      </div>
    );

    useLayoutEffect(() => {
      if (!groupRef.current) return;
      isUnmountingRef.current = false;

      scene.updateMatrixWorld();
      const vec = calculatePosition(groupRef.current, camera, size);
      const scale =
        distanceFactor === undefined
          ? 1
          : objectScale(groupRef.current, camera) * distanceFactor;
      el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale});transform-origin:0 0;z-index:${objectZIndex(groupRef.current, camera, zIndexRange)};`;

      if (target) {
        if (prepend) target.prepend(el);
        else target.appendChild(el);
      }

      const mountTimer = setTimeout(() => {
        if (isUnmountingRef.current) return;
        if (!rootRef.current) {
          rootRef.current = ReactDOM.createRoot(el);
        }
        if (latestContentRef.current) {
          rootRef.current.render(latestContentRef.current);
        }
      }, 0);

      return () => {
        isUnmountingRef.current = true;
        clearTimeout(mountTimer);
        const currentRoot = rootRef.current;
        rootRef.current = null;
        if (target && el.parentNode === target) {
          target.removeChild(el);
        }
        setTimeout(() => {
          try {
            currentRoot?.unmount();
          } catch {
            // Ignore unmount errors if already disposed
          }
        }, 0);
      };
    }, [target, prepend]);

    useLayoutEffect(() => {
      if (wrapperClass) el.className = wrapperClass;
    }, [wrapperClass, el]);

    useEffect(() => {
      const renderTimer = setTimeout(() => {
        if (isUnmountingRef.current || !rootRef.current) return;
        if (latestContentRef.current) {
          rootRef.current.render(latestContentRef.current);
        }
      }, 0);
      return () => clearTimeout(renderTimer);
    });

    const visible = useRef(true);

    useFrame(() => {
      if (!groupRef.current) return;
      camera.updateMatrixWorld();
      groupRef.current.updateWorldMatrix(true, false);
      const vec = calculatePosition(groupRef.current, camera, size);

      if (
        Math.abs(oldZoom.current - camera.zoom) > eps ||
        Math.abs(oldPosition.current[0] - vec[0]) > eps ||
        Math.abs(oldPosition.current[1] - vec[1]) > eps
      ) {
        const isBehindCamera = isObjectBehindCamera(groupRef.current, camera);
        const previouslyVisible = visible.current;
        visible.current = !isBehindCamera;

        if (previouslyVisible !== visible.current) {
          el.style.display = visible.current ? 'block' : 'none';
        }

        el.style.zIndex = `${objectZIndex(groupRef.current, camera, zIndexRange)}`;
        const scale =
          distanceFactor === undefined
            ? 1
            : objectScale(groupRef.current, camera) * distanceFactor;
        el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`;

        oldPosition.current = vec;
        oldZoom.current = camera.zoom;
      }
    });

    return <group {...props} ref={groupRef} />;
  }
);

export default Html;
