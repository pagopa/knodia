import { type Preview } from "@storybook/react-vite";

// TODO: valutare se aggiungere uno switcher in toolbar per caricare orion.css
// o lynx.css a runtime (es. via globalTypes + decorators), così da testare le
// stories con entrambi i temi senza due istanze Storybook separate.
import "../src/themes/orion.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
