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
      }

      .content {
        padding: 2rem;
      }

    p {
        margin-bottom: 1.5rem;
        font-size: 1rem;
        line-height: 1.5;
        color: #555555;
    }

      .header-text {
        margin-bottom: 0.5rem;
        font-size: 1.3rem;
        font-weight: 600;
        color: #333333;
      }

    .button {
        background-color: #2c50bc;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(44, 80, 188, 0.2);
      }
      
      .button:hover {
        background-color: #2445a5;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(44, 80, 188, 0.3);
      }
      
      .button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(44, 80, 188, 0.2);
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="logo-container">
        <div class="logo">KAJI<span>X</span></div>
        <div>
          <div class="tagline">AI-First</div>
          <div class="tagline">human-centric</div>
        </div>
      </div>
    </header>
    <div class="content">
      ${content}
    </div>
  </body>
</html>`;
};
