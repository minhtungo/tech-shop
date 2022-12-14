import Head from 'next/head';
import Navbar from './../components/Navbar';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Currency from 'react-currency-formatter';
import { useSelector } from 'react-redux';
import Stripe from 'stripe';
import Button from '../components/Button';
// import CheckoutProduct from "../components/CheckoutProduct";
import { selectBasketItems, selectBasketTotal } from '../redux/basketSlice';
import CheckoutProduct from '../components/CheckoutProduct';
import { fetchPostJSON } from '../utils/api-helpers';
import getStripe from '../utils/get-stripejs';

function Checkout() {
  const items = useSelector(selectBasketItems);
  const basketTotal = useSelector(selectBasketTotal);
  const router = useRouter();
  const [groupedItemsInBasket, setGroupedItemsInBasket] = useState(
    {} as { [key: string]: Product[] }
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const groupedItems = items.reduce((results, item) => {
      (results[item._id] = results[item._id] || []).push(item);
      return results;
    }, {} as { [key: string]: Product[] });

    setGroupedItemsInBasket(groupedItems);
  }, [items]);

  const createCheckoutSession = async () => {
    setLoading(true);

    const checkoutSession: Stripe.Checkout.Session = await fetchPostJSON(
      'api/checkout_sessions',
      { items: items }
    );

    //Internal Error
    if ((checkoutSession as any).statusCode === 500) {
      console.error((checkoutSession as any).message);
      return;
    }

    //Redirect to checkout
    const stripe = await getStripe();
    const { error } = await stripe!.redirectToCheckout({
      sessionId: checkoutSession.id,
    });
    console.warn(error.message);

    setLoading(false);
  };

  return (
    <div className='min-h-screen overflow-hidden bg-[#E7ECEE]'>
      <Head>
        <title>Checkout</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Navbar />
      <main className='mx-auto max-w-5xl'>
        <div className='px-5'>
          <h1 className='my-4 text-3xl font-semibold lg:text-4xl'>
            {items.length > 0 ? 'Review your bag.' : 'Your bag is empty.'}
          </h1>
          <p className='my-4'>Free delivery and free returns.</p>

          {items.length === 0 && (
            <Button
              title='Continue Shopping'
              onClick={() => router.push('/')}
            />
          )}
        </div>

        {items.length > 0 && (
          <div className='mx-5 md:mx-8'>
            {Object.entries(groupedItemsInBasket).map(([key, items]) => (
              <CheckoutProduct key={key} items={items} id={key} />
            ))}

            <div className='my-12 mt-6 ml-auto max-w-3xl'>
              <div className='divide-y divide-gray-300'>
                <div className='pb-4'>
                  <div className='flex justify-between'>
                    <p>Subtotal</p>
                    <p>
                      <Currency quantity={basketTotal} currency='CAD' />
                    </p>
                  </div>
                  <div className='flex justify-between'>
                    <p>Shipping</p>
                    <p>FREE</p>
                  </div>
                  <div className='flex justify-between'>
                    <div className='flex flex-col gap-x-1 lg:flex-row'>
                      Estimated tax for:
                      <p className='flex cursor-pointer items-end text-blue-500 hover:underline'>
                        Enter zip code
                        <ChevronDownIcon className='h-6 w-6' />
                      </p>
                    </div>
                    <p>$ -</p>
                  </div>
                </div>

                <div className='flex justify-between pt-4 text-xl font-semibold'>
                  <h4>Total</h4>
                  <h4>
                    <Currency quantity={basketTotal} currency='CAD' />
                  </h4>
                </div>
              </div>

              <div className='mt-6'>
                <Button
                  noIcon
                  loading={loading}
                  title='Check Out'
                  width='w-full'
                  onClick={createCheckoutSession}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
