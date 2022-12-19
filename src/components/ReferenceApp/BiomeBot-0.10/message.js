class Message {
  /* ユーザとチャットボットのメッセージコンテナクラス 
    usege:
    m = new Message();
    obj={
      text: "",
      backgroundColor: "",
      avatar: "",
      name: "",
      ownerType: "bot" | "user"
    }
    m = new Message(obj);
  
  */
  constructor(obj){
    if(!obj){
      this.text = "";
      this.backgroundColor = "";
      this.avatar = "";
      this.name = "";
      this.ownerType ="";
    }
    else if(obj !== null && typeof obj === 'object'){
      for(let key in obj){
        this[key] = obj[key]
      }
    }
  }



}