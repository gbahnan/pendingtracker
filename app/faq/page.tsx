export default function FaqPage() {
  return (
    <div className="card">
      <div style={{ fontWeight: 900, fontSize: 20 }}>FAQ (plain English)</div>
      <p className="p">These are the most common reasons a Bitcoin transaction looks “stuck”.</p>

      <div style={{ fontWeight: 900, marginTop: 12 }}>1) Fees are too low</div>
      <p className="p">
        Bitcoin has a waiting line. People who pay higher fees usually get processed sooner. If your fee is low, you might wait longer.
      </p>

      <div style={{ fontWeight: 900, marginTop: 12 }}>2) RBF (fee bump)</div>
      <p className="p">
        Some wallets let you “bump the fee” by replacing the transaction with a higher-fee version.
      </p>

      <div style={{ fontWeight: 900, marginTop: 12 }}>3) CPFP</div>
      <p className="p">
        If you control the coins being sent, you can sometimes create a second transaction that pays a higher fee, and miners include both.
      </p>

      <div style={{ fontWeight: 900, marginTop: 12 }}>4) Not found</div>
      <p className="p">
        If no explorer can see the transaction, your wallet/exchange may not have broadcast it yet, or it may have been replaced.
      </p>
    </div>
  );
}
