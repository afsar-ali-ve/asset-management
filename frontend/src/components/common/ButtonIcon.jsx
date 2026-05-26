import React from 'react';

const ButtonIcon = ({ type, className = 'h-4 w-4' }) => {
  const iconProps = {
    className,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': 'true',
  };

  const paths = {
    add: <path d="M10 4.25V15.75M4.25 10H15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    apply: <path d="M16.25 6.25L8.75 13.75L5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    clear: <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75M3.75 16.25H16.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>,
    close: <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    columns: <path d="M4 5.25H7.5V14.75H4V5.25ZM8.25 5.25H11.75V14.75H8.25V5.25ZM12.5 5.25H16V14.75H12.5V5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>,
    delete: <path d="M6.25 7.25V15.25M10 7.25V15.25M13.75 7.25V15.25M4.75 4.75H15.25M8.25 4.75V3.25H11.75V4.75M5.75 4.75L6.25 17H13.75L14.25 4.75" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/>,
    edit: <path d="M4.25 14.5L4 16.25L5.75 16L14.5 7.25L13 5.75L4.25 14.5ZM12.25 4.5L13.25 3.5C13.8 2.95 14.7 2.95 15.25 3.5L16.5 4.75C17.05 5.3 17.05 6.2 16.5 6.75L15.5 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
    menu: <path d="M7 7.5H13M7 10H13M7 12.5H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>,
    next: <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    previous: <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    reset: <path d="M5.25 7.25A5.75 5.75 0 1 1 6 14M5.25 7.25H9M5.25 7.25V3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>,
    save: <path d="M5 3.75H13.25L16.25 6.75V16.25H3.75V3.75H5ZM7 3.75V8.25H13V3.75M6.75 16.25V11.75H13.25V16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
  };

  return <svg {...iconProps}>{paths[type]}</svg>;
};

export default ButtonIcon;
