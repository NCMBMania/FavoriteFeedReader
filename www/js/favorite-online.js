var Favorite = (function() {
  var Favorite = function(options) {
    // options にはmBaaSのアプリケーションキーとクライアントキーが入ってきます。
    this.ncmb = new NCMB(options.applicationKey, options.clientKey);

    // 記事リストを指定するためのID
    this.listEl = "#feed-list";

    // 保存先クラスを定義するところ
    this.FavoriteClass = this.ncmb.DataStore("favorite");

    // アプリ＋端末を特定するためのuuidを取得
    this.uuid = getUuid();

    // お気に入りのOn/Offイベントの有効フラグ
    this.clickEnabled = true;

    // タップした時の処理を記述
    this.addClickHandler();

    // オプションが指定されている場合はその値で上書き
    if (options) {
      $.extend(this, options);
    }
  }
  Favorite.prototype.applyAll = function() {
    var self = this;
    $(this.listEl).children('li').each(function(index) {
      var item = $(this);
      self.apply(item);
    });
  };

// お気に入りの削除
Favorite.prototype.remove = function(item) {
  var self = this;
  var url = item.data('link');

  // uuidとurlの両方が合致するオブジェクトを検索し、見つけたものを削除する
  this.FavoriteClass.equalTo("uuid", self.uuid) // UUIDとURLで検索します
    .equalTo("url", url)
    .fetch() // 今回は count ではなく fetchを使います
    .then(function(favorite){
      // データが見つかったら、それを削除します
      favorite.delete()
      .then(function(result){
        // 削除処理がうまくいったら表示の更新を行います
        self.apply(item);
      })
      .catch(function(error){
        // 削除処理がうまくいかない場合も表示を更新します
        self.apply(item);
      });
    })
    .catch(function(error){
      // データが取得できなかった場合も表示を更新します
      self.apply(item);
    });

};

// お気に入りのOn/Offイベント時の処理
Favorite.prototype.addClickHandler = function() {
  var self = this;

  // 記事一覧の中のstarクラスに対してclickイベントを指定します。
  $(this.listEl).on('click', '.star', function(event) {

    // タップ設定が有効であれば処理を行います
    // これは二重処理の防止です
    if (self.clickEnabled == true) {
      // 一旦二重処理を防ぎます
      self.clickEnabled = false;

      // フラグは1秒後に立て直します
      setTimeout(function(){ self.clickEnabled = true; }, 1000);

      // 星マークのクラスで処理を判別します。
      if ($(this).hasClass('fa-star-o')) {
        // 空であればお気に入り未登録→お気に入り登録処理
        self.add($(this).closest('li'));
      } else {
        // 塗りつぶされている場合はお気に入り登録済み→お気に入り解除処理
        self.remove($(this).closest('li'));
      }
    }
    event.stopPropagation();
  });
};

// お気に入りの追加
Favorite.prototype.add = function(item) {
  var self = this;
  var url = item.data('link');

  // 保存するオブジェクトを生成するところ
  var favorite = new this.FavoriteClass();

  // 保存したい値をセットし、保存するところ
  favorite.set("uuid", self.uuid)
    .set("url", url)
    // 保存したい値をセットし、保存
    .save()
    .then(function(favorite){
      // 保存が成功した場合
      self.apply(item);
    })
    .catch(function(error){
      // 保存が失敗した場合
      self.apply(item);
    });
};


  
// お気に入りの状況を画面に反映させる
Favorite.prototype.apply = function(item) {
  var self = this;
  var url = item.data('link');
  var icon = item.children('i');

  // urlだけが合致するオブジェクトの数を取得し、星の横に表示するところ
  this.FavoriteClass.equalTo("url", url)
    .count()
    .fetchAll()
    .then(function(results){
      if (results.count > 0) {
        icon.text(results.count);
      } else {
        icon.text("0");
      }
    })
    .catch(function(error){
      console.log(error.message);
      icon.text("0");
    });

  // urlとuuidの両方が合致するオブジェクトの数を取得し、星の色を変更するところ
  this.FavoriteClass.equalTo("uuid", self.uuid)
    .equalTo("url", url)
    .count()
    .fetchAll()
    .then(function(results){
      if (results.count > 0) {
        icon.addClass('fa-star');
        icon.removeClass('fa-star-o');
      } else {
        icon.removeClass('fa-star');
        icon.addClass('fa-star-o');
      }
    })
    .catch(function(error){
      console.log('own favorite check error: ' + error.message);
    });        
};

  // アプリ+端末を特定するためのuuidを取得
  // uuidはアプリアンインストールで削除されます
  var getUuid = function() {
    var uuid = localStorage.getItem('uuid');
    if (uuid === null) {
      // uuid未生成の場合は新規に作る
      var S4 = function(){
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      uuid = (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
      localStorage.setItem('uuid', uuid);
    }
    return uuid;
  };
  return Favorite;
})();