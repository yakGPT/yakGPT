import * as React from "react";

const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    {...props}
  >
    <mask id="a">
      <rect width={100} height={100} rx={0} ry={0} fill="#fff" />
    </mask>
    <g mask="url(#a)">
      <path fill="#0a5b83" d="M0 0h100v100H0z" />
      <path
        d="M-60.32 87.478A60 60 0 1 1 40.32 22.122 60 60 0 0 1-60.32 87.478Z"
        fill="#69d2e7"
      />
      <path
        d="M10.4 97.962 2.038 18.4 81.6 10.038 89.962 89.6 10.4 97.962Z"
        fill="#f1f4dc"
      />
      <path
        d="M26.246 41.671a20 20 0 1 1 39.508 6.258 20 20 0 0 1-39.508-6.258Z"
        fill="#f88c49"
      />
    </g>
  </svg>
);

export default SvgComponent;
