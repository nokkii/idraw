package idraw.model;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import idraw.orm.DbInstanceDao;
import idraw.orm.DbStaticDao;

public class User extends DbInstanceDao<User> {
	// ORMはTABLE_NAME, THIS_CLASSの入力とカラムと同名のフィールドを定義すれば後は大体コピペで使える

	// ORMでクラスをテーブルにマッピングするのに必要
	private final static String TABLE_NAME = "user";
	private final static Class<User> THIS_CLASS = User.class;
	private static ArrayList<String> columnNames;
	private static DbStaticDao<User> dbStaticAdapter = null;
	private static DbInstanceDao<User> dbAdapter = null;

	// 同名のカラムと対応
	public String username;
	public String pwd;
	public String salt;
	public String secret_key;
	public String session_id;

	// newしてsaveするとcreateが走る
	public User() throws SQLException {
		super(THIS_CLASS, TABLE_NAME);
		adapterStandby();
	}

	public User(Map<String, Object> params) throws SQLException {
		super(THIS_CLASS, TABLE_NAME);
		adapterStandby();
		this.username = (String) params.get("username");
		this.pwd = (String) params.get("pwd");
		this.salt = (String) params.get("salt");
		this.secret_key = (String) params.get("secret_key");
		this.session_id = (String) params.get("session_id");
		newFlag = true;
	}

	// 検索関数を定義
	public static User findBy(String column_name, Object value) throws SQLException, InstantiationException,
			IllegalAccessException, ClassNotFoundException, NoSuchFieldException, SecurityException {
		adapterStandby();
		return dbStaticAdapter.findBy(column_name, value);
	}

	// 複数の条件で検索するためのメソッド
	public static ArrayList<User> find(Map<String, Object> columnObjectMap) throws SQLException, InstantiationException,
			IllegalAccessException, ClassNotFoundException, NoSuchFieldException, SecurityException {
		adapterStandby();
		return dbStaticAdapter.find((HashMap<String, Object>) columnObjectMap);
	}

	public static ArrayList<User> findPartial(String column_name, String value)
			throws SQLException, InstantiationException, IllegalAccessException, ClassNotFoundException,
			NoSuchFieldException, SecurityException {
		adapterStandby();
		return dbStaticAdapter.findPartial(column_name, value);
	}

	// クラスの設定が初期化されていないときに呼ばれる
	private static void adapterStandby() throws SQLException {
		if (dbStaticAdapter == null || dbAdapter == null) {
			// クラスメソッドを使うための設定
			dbStaticAdapter = new DbStaticDao<User>(THIS_CLASS, TABLE_NAME);
			// インスタンスメソッドを使うための設定
			dbAdapter = new DbInstanceDao<User>(THIS_CLASS, TABLE_NAME);
			// クラスのカラム名一覧を設定
			columnNames = dbStaticAdapter.getColumnNames();
		}
	}

	// クラスのモデルのカラム名一覧を取得
	public static ArrayList<String> getColumnNames() {
		return columnNames;
	}

	//ユーザーネームのsetter(バリデータ(英数字20字まで)を含む)
	public boolean setName(String userName) {
		int uNameLength = userName.length();
		if (uNameLength <= 20 && userName.matches("[0-9a-zA-Z]+$")) {
			this.username = userName;
			return true;
		} else {
			return false;
		}
	}

	// パスワードのsetter(バリデータ(英数字混合8字以上)を含む)
	public boolean setPass(String userPass) {
		int uPassLength = userPass.length();
		if (uPassLength >= 8 && userPass.matches("^[0-9a-zA-Z]+$") && !(userPass.matches("^[0-9]+$"))
				&& !(userPass.matches("^[a-zA-Z]+$"))) {
			this.pwd = userPass;
			return true;
		} else {
			return false;
		}
	}
}
