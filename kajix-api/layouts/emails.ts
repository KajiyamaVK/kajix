export const emailLayout = (title: string, content: string) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Arial', sans-serif;
        max-width: 1280px;
        margin-right: auto;
        margin-left:auto;
      }
      
      body {
        background-color: #f5f5f5;
      }
      
      .header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1.5rem;
        background-color: #000000;
        position: relative;
        overflow: hidden;
      }
     
      
      .logo-container {
        position: relative;
        display: flex;
        align-items: end;
        gap: 0.25rem;
      }
      
      .logo {
        font-size: 2.5rem;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 2px;
        line-height: 1;
      }
      
      .logo span {
        color: #2c50bc;
      }
      
      .tagline {
        color: #ffffff;
        font-size: 0.8rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        opacity: 0.8;
        line-height: 1;
        margin-bottom:4px;
      }

      .content {
        padding: 2rem;
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="logo-container">
        <div class="logo">KAJI<span>X</span></div>
        <div class="tagline">Simplicity in design</div>
      </div>
    </header>
    <div class="content">
      ${content}
    </div>
  </body>
</html>`;
};
