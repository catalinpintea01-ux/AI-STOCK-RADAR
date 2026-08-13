export default function StockLogo({ simbol, size = 28 }) {
  return (
    <img
      src={`https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${simbol}.png`}
      alt=""
      className="stock-logo"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
