module.exports = (function(){
  console.log('Initialized Serial');

  let inputHandler = null;

  const setInputHandler = (handler) => {
    inputHandler = handler;
  }

  const authorize = () => {
    // TODO: implement
  }

  const deauthorize = () => {
    // TODO: implement
  }

  const begin = () => {
    // TODO: implement list ports, connect, attach input handlers, etc
  }

  return {
    setInputHandler,
    authorize,
    deauthorize,
    begin
  };
})();