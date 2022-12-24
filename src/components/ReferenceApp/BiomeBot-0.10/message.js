export default class Message {
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
      this.avatarPath = "";
      this.name = "";
      this.person ="";
    }
    else if(obj !== null && typeof obj === 'object'){
      this.text = obj.text;
      this.backgroudColor=obj.backgroundColod;
      this.photoURL = obj.photoURL;
      this.person=obj.person;
      this.name=obj.name;
    }
    this.id=Date.now()
  }



}