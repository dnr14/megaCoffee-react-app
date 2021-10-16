export const size = {
  pc: '75em', // 1200px
  tab: '56.25em', // 900px
  mobile: '31.25em', // 500px
  mobileS: '23.125em', // 370px
};

const theme = {
  color: {
    magacoffeColor: '#ff9f43',
    white1: '#f7fbff',
    white2: '#fff',
    red1: '#e74c3c',
    green1: '#2ecc71',
    shadowColor: 'rgba(45, 52, 54,0.5)',
  },
  media: {
    pc: `@media screen and (max-width: ${size.pc})`,
    tab: `@media screen and (max-width: ${size.tab})`,
    mobile: `@media screen and (max-width: ${size.mobile})`,
    mobileS: `@media screen and (max-width: ${size.mobileS})`,
  },
  borderRadius: '5px',
  maxWidth: '1100px',
};

export default theme;
