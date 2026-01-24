export default function FaqPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>FAQ</h1>

      <h3>Why is my Bitcoin transaction pending?</h3>
      <p>
        Bitcoin has a “waiting line.” Transactions that pay higher fees usually get confirmed sooner.
      </p>

      <h3>What is RBF?</h3>
      <p>
        Some wallets let you “bump the fee” by replacing the transaction with a higher-fee version.
      </p>

      <h3>What is CPFP?</h3>
      <p>
        If you control the coins being sent, you can sometimes create a second transaction that pays a higher fee, and miners include both.
      </p>
    </div>
  );
}
